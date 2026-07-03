import React, { useEffect, useState, useRef } from "react";
import { Modal, Form, Input, message, Spin, Tabs, Select, Button, Card, Upload, Image } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { fetchOPSCharacterSettingsApi, updateOPSCharacterSettingsApi, uploadImageApi, type OPSCharacterSettings } from "@/apis";
import { CHARACTER_SEARCH_TAG_OPTIONS } from "@/constants/character-search-tags";
import { getEnvValue } from "@/utils/env";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";

const IMAGE_BASE_URL = getEnvValue("VITE_IMAGE_BASE_URL").replace(/\/$/, "");

function pathToDisplayUrl(path: string): string {
  if (!path?.trim()) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = IMAGE_BASE_URL;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

function urlToStoragePath(urlOrPath: string): string {
  if (!urlOrPath?.trim()) return "";
  if (!urlOrPath.startsWith("http://") && !urlOrPath.startsWith("https://")) return urlOrPath.trim();
  try {
    const u = new URL(urlOrPath);
    const path = u.pathname;
    return path.startsWith("/") ? path.slice(1) : path;
  } catch {
    return urlOrPath.trim();
  }
}

function ImageUrlField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  const handleUpload = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      message.error("Please upload PNG, JPG or WebP image");
      return false;
    }
    try {
      const res = await uploadImageApi(file);
      const url = res?.url;
      if (url) {
        const path = urlToStoragePath(url);
        onChange?.(path);
        message.success("Upload succeeded");
      }
    } catch {
      message.error("Upload failed");
    }
    return false;
  };
  const displayUrl = value ? pathToDisplayUrl(value) : "";
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
      <Upload accept={IMAGE_ACCEPT} showUploadList={false} beforeUpload={handleUpload}>
        <Button type="default">Upload image</Button>
      </Upload>
      {displayUrl && (
        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0, borderRadius: 4, overflow: "hidden", background: "#f0f0f0" }}>
          <Image src={displayUrl} alt="" width={80} height={80} style={{ objectFit: "cover" }} preview={false} />
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            style={{ position: "absolute", top: 0, right: 0, zIndex: 1, padding: 2, minWidth: 24, height: 24, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none" }}
            onClick={() => onChange?.("")}
          />
        </div>
      )}
    </div>
  );
}

function ImageUrlsField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  const parts = (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const handleUpload = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      message.error("Please upload PNG, JPG or WebP image");
      return false;
    }
    try {
      const res = await uploadImageApi(file);
      const url = res?.url;
      if (url) {
        const path = urlToStoragePath(url);
        const next = parts.length > 0 ? [...parts, path].join(", ") : path;
        onChange?.(next);
        message.success("Upload succeeded");
      }
    } catch {
      message.error("Upload failed");
    }
    return false;
  };
  const removeAt = (index: number) => {
    const next = parts.filter((_, i) => i !== index).join(", ");
    onChange?.(next);
  };
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
      <Upload accept={IMAGE_ACCEPT} showUploadList={false} beforeUpload={handleUpload}>
        <Button type="default">Upload image</Button>
      </Upload>
      {parts.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {parts.map((path, i) => {
            const displayUrl = pathToDisplayUrl(path);
            return (
              <div key={i} style={{ position: "relative", width: 80, height: 80, flexShrink: 0, borderRadius: 4, overflow: "hidden", background: "#f0f0f0" }}>
                <Image src={displayUrl} alt="" width={80} height={80} style={{ objectFit: "cover" }} preview={false} />
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  style={{ position: "absolute", top: 0, right: 0, zIndex: 1, padding: 2, minWidth: 24, height: 24, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none" }}
                  onClick={() => removeAt(i)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface RoleEditModalProps {
  open: boolean;
  onClose: () => void;
  roleId: string;
  roleName: string;
  onSuccess?: () => void;
}

function toArr(v: string | string[] | null | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

const RoleEditModal: React.FC<RoleEditModalProps> = ({
  open,
  onClose,
  roleId,
  roleName,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const initialAttrsRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (open && roleId) {
      setLoading(true);
      fetchOPSCharacterSettingsApi(roleId)
        .then((data) => {
          const attrs = (data.attributes ?? {}) as Record<string, unknown>;
          initialAttrsRef.current = JSON.parse(JSON.stringify(attrs));
          const unOffice = (attrs.un_office_value ?? {}) as Record<string, unknown>;
          const mesEx = attrs.mes_example;
          form.setFieldsValue({
            avatar_url: data.avatar_url ?? "",
            greeting_image: data.greeting_image ?? "",
            background_image_files: data.background_image_files ?? "",
            ncover: data.ncover ?? 0,
            name: attrs.name ?? "",
            age: attrs.age ?? "",
            description: attrs.description ?? "",
            personality: typeof attrs.personality === "string" ? [attrs.personality] : toArr(attrs.personality as string[]),
            scenario: attrs.scenario ?? "",
            first_mes: attrs.first_mes ?? "",
            mes_example: (() => {
              if (!mesEx) return [];
              if (Array.isArray(mesEx)) {
                return mesEx.map((e) => ({ user: String((e as Record<string, unknown>)?.user ?? ""), character: String((e as Record<string, unknown>)?.character ?? "") }));
              }
              try {
                const parsed = JSON.parse(String(mesEx));
                return Array.isArray(parsed) ? parsed.map((e) => ({ user: String((e as Record<string, unknown>)?.user ?? ""), character: String((e as Record<string, unknown>)?.character ?? "") })) : [];
              } catch {
                return [];
              }
            })(),
            creator_notes: attrs.creator_notes ?? "",
            system_prompt: attrs.system_prompt ?? "",
            post_history_instrutions: attrs.post_history_instrutions ?? "",
            alternate_greetings: attrs.alternate_greetings ?? "",
            tags: toArr(attrs.tags as string[]),
            creator: attrs.creator ?? "",
            character_version: attrs.character_version ?? "",
            body: toArr(attrs.body as string[]),
            gender: attrs.gender ?? undefined,
            category: attrs.category ?? undefined,
            Introduction: attrs.Introduction ?? "",
            character_search_tags: toArr(attrs.character_search_tags as string[]),
            voice: attrs.voice ?? "",
            base_model: unOffice.base_model ?? "",
            base_prompt: typeof unOffice.base_prompt === "string"
              ? unOffice.base_prompt.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            lora: (() => {
              const loraArr = Array.isArray(unOffice.lora) ? unOffice.lora : [];
              const strengthArr = Array.isArray(unOffice.lora_strength) ? unOffice.lora_strength : [];
              if (loraArr.length === 0) return [];
              return loraArr.map((item, i) => {
                const name = typeof item === "string" ? item : String((item as unknown[])?.[0] ?? "");
                const strength = i < strengthArr.length ? Number(strengthArr[i]) || 0 : 0;
                return { name, strength };
              });
            })(),
          });
        })
        .catch((err) => {
          message.error(err?.message || "Failed to load character settings");
        })
        .finally(() => setLoading(false));
    }
  }, [open, roleId, form]);

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      const initial = initialAttrsRef.current;
      const initialUnOffice = (initial.un_office_value ?? {}) as Record<string, unknown>;

      const mesExample = (values.mes_example as { user?: string; character?: string }[] | undefined) ?? [];
      const loraItems = (values.lora as { name?: string; strength?: number }[] | undefined) ?? [];
      const personalityArr = values.personality as string[] | undefined;
      const personality = personalityArr?.length
        ? (personalityArr.length === 1 ? personalityArr[0] : personalityArr)
        : (initial.personality as string | string[] | null) ?? null;

      const tagsVal = values.tags as string[] | undefined;
      const bodyVal = values.body as string[] | undefined;
      const charTagsVal = values.character_search_tags as string[] | undefined;

      const attributes: Record<string, unknown> = {
        name: values.name !== undefined && values.name !== "" ? values.name : (initial.name ?? null),
        age: values.age !== undefined && values.age !== "" ? values.age : (initial.age ?? null),
        description: values.description !== undefined ? values.description : (initial.description ?? null),
        personality,
        scenario: values.scenario !== undefined ? values.scenario : (initial.scenario ?? null),
        first_mes: values.first_mes !== undefined ? values.first_mes : (initial.first_mes ?? null),
        mes_example: (() => {
          const arr = mesExample
            .map((e) => ({ user: String(e?.user ?? "").trim(), character: String(e?.character ?? "").trim() }))
            .filter((e) => e.user || e.character);
          return arr.length > 0 ? arr : (Array.isArray(initial.mes_example) ? initial.mes_example : null);
        })(),
        creator_notes: values.creator_notes !== undefined ? values.creator_notes : (initial.creator_notes ?? null),
        system_prompt: values.system_prompt !== undefined ? values.system_prompt : (initial.system_prompt ?? null),
        post_history_instrutions: values.post_history_instrutions !== undefined ? values.post_history_instrutions : (initial.post_history_instrutions ?? null),
        alternate_greetings: values.alternate_greetings !== undefined ? values.alternate_greetings : (initial.alternate_greetings ?? null),
        tags: (tagsVal?.length ? tagsVal : null) ?? (Array.isArray(initial.tags) ? initial.tags : null),
        creator: values.creator !== undefined ? values.creator : (initial.creator ?? null),
        character_version: values.character_version !== undefined ? values.character_version : (initial.character_version ?? null),
        body: (bodyVal?.length ? bodyVal : null) ?? (Array.isArray(initial.body) ? initial.body : null),
        gender: values.gender !== undefined ? values.gender : (initial.gender ?? null),
        category: values.category !== undefined ? values.category : (initial.category ?? null),
        Introduction: values.Introduction !== undefined ? values.Introduction : (initial.Introduction ?? null),
        character_search_tags: (charTagsVal?.length ? charTagsVal : null) ?? (Array.isArray(initial.character_search_tags) ? initial.character_search_tags : null),
        voice: values.voice !== undefined ? values.voice : (initial.voice ?? null),
        un_office_value: {
          base_model: values.base_model !== undefined ? values.base_model : (initialUnOffice.base_model ?? null),
          base_prompt: (() => {
            const arr = (values.base_prompt as string[] | undefined) ?? [];
            return arr.length > 0 ? arr.join(", ") : (initialUnOffice.base_prompt ?? null);
          })(),
          lora: loraItems.filter((e) => (e?.name ?? "").trim()).length > 0
            ? loraItems.filter((e) => (e?.name ?? "").trim()).map((e) => (e?.name ?? "").trim())
            : (Array.isArray(initialUnOffice.lora) ? initialUnOffice.lora : []),
          lora_strength: loraItems.filter((e) => (e?.name ?? "").trim()).length > 0
            ? loraItems.filter((e) => (e?.name ?? "").trim()).map((e) => Number(e?.strength) || 0)
            : (Array.isArray(initialUnOffice.lora_strength) ? initialUnOffice.lora_strength : []),
        },
      };
      const avatarPath = values.avatar_url ? urlToStoragePath(values.avatar_url) : null;
      const greetingPath = values.greeting_image ? urlToStoragePath(values.greeting_image) : null;
      const backgroundPaths = values.background_image_files
        ? (values.background_image_files as string)
            .split(",")
            .map((s) => urlToStoragePath(s.trim()))
            .filter(Boolean)
            .join(", ") || null
        : null;
      const payload: Partial<OPSCharacterSettings> = {
        attributes,
        avatar_url: avatarPath || null,
        greeting_image: greetingPath || null,
        background_image_files: backgroundPaths || null,
        ncover: values.ncover ?? null,
      };
      setSubmitting(true);
      await updateOPSCharacterSettingsApi(roleId, payload);
      message.success("Saved successfully");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      if (e?.message && !e.message.includes("validateFields")) {
        message.error(e.message || "Save failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Edit: ${roleName}`}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      width={800}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Tabs destroyInactiveTabPane={false}
            items={[
              {
                key: "basic",
                label: "Basic",
                children: (
                  <>
                    <Form.Item name="avatar_url" label="Avatar URL">
                      <ImageUrlField />
                    </Form.Item>
                    <Form.Item name="greeting_image" label="Greeting Image URL">
                      <ImageUrlField />
                    </Form.Item>
                    <Form.Item name="background_image_files" label="Background Image Files">
                      <ImageUrlsField />
                    </Form.Item>
                    <Form.Item name="name" label="Name">
                      <Input placeholder="Character name" />
                    </Form.Item>
                    <Form.Item name="age" label="Age">
                      <Input />
                    </Form.Item>
                    <Form.Item name="gender" label="Gender">
                      <Select allowClear placeholder="Male / Female" options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]} />
                    </Form.Item>
                    <Form.Item name="category" label="Category">
                      <Select allowClear placeholder="Anime / Realistic" options={[{ value: "Anime", label: "Anime" }, { value: "Realistic", label: "Realistic" }]} />
                    </Form.Item>
                    <Form.Item name="Introduction" label="Introduction">
                      <Input.TextArea rows={4} placeholder="Character introduction" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="creator" label="Creator">
                      <Input />
                    </Form.Item>
                    <Form.Item name="character_version" label="Character Version">
                      <Input />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: "dialogue",
                label: "Dialogue",
                children: (
                  <>
                    <Form.Item name="first_mes" label="First Message (Greeting)">
                      <Input.TextArea rows={6} placeholder="Greeting message" />
                    </Form.Item>
                    <Form.Item name="scenario" label="Scenario">
                      <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="personality" label="Personality">
                      <Select mode="tags" placeholder="Type and press Enter to add" tokenSeparators={[","]} />
                    </Form.Item>
                    <Form.Item name="voice" label="Voice">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Message Examples">
                      <Form.List name="mes_example">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <Card key={key} size="small" style={{ marginBottom: 12 }}>
                                <Form.Item {...restField} name={[name, "user"]} label="User">
                                  <Input.TextArea rows={2} placeholder="User says..." />
                                </Form.Item>
                                <Form.Item {...restField} name={[name, "character"]} label="Character">
                                  <Input.TextArea rows={3} placeholder="Character replies..." />
                                </Form.Item>
                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)}>
                                  Remove
                                </Button>
                              </Card>
                            ))}
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                              Add dialogue pair
                            </Button>
                          </>
                        )}
                      </Form.List>
                    </Form.Item>
                  </>
                ),
              },
              {
                key: "tags",
                label: "Tags",
                children: (
                  <>
                    <Form.Item name="tags" label="Tags">
                      <Select mode="tags" placeholder="Type and press Enter to add tag" tokenSeparators={[","]} />
                    </Form.Item>
                    <Form.Item name="character_search_tags" label="Character Search Tags">
                      <Select
                        mode="multiple"
                        placeholder="Select tags"
                        options={CHARACTER_SEARCH_TAG_OPTIONS}
                        tokenSeparators={[","]}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        optionFilterProp="label"
                      />
                    </Form.Item>
                    <Form.Item name="body" label="Body">
                      <Select mode="tags" placeholder="Type and press Enter to add" tokenSeparators={[","]} />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: "advanced",
                label: "Advanced",
                children: (
                  <>
                    <Form.Item name="creator_notes" label="Creator Notes">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="system_prompt" label="System Prompt">
                      <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="post_history_instrutions" label="Post History Instructions">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="alternate_greetings" label="Alternate Greetings">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="base_model" label="Base Model (un_office_value)">
                      <Input placeholder="model.safetensors" />
                    </Form.Item>
                    <Form.Item name="base_prompt" label="Base Prompt (un_office_value)">
                      <Select mode="tags" placeholder="Type and press Enter to add tag" tokenSeparators={[","]} />
                    </Form.Item>
                    <Form.Item label="Lora">
                      <Form.List name="lora">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <Card key={key} size="small" style={{ marginBottom: 12 }}>
                                <Form.Item {...restField} name={[name, "name"]} label="Model">
                                  <Input placeholder="model.safetensors" />
                                </Form.Item>
                                <Form.Item
                                  {...restField}
                                  name={[name, "strength"]}
                                  label="Lora Strength"
                                  rules={[
                                    {
                                      validator: (_, value) => {
                                        if (value === undefined || value === null || value === "") return Promise.resolve();
                                        const str = String(value).trim();
                                        if (!/^-?(\d+\.?\d*|\d*\.\d+)([eE][-+]?\d+)?$/.test(str)) {
                                          return Promise.reject(new Error("Must be a valid number (integers and decimals allowed)"));
                                        }
                                        const num = Number(value);
                                        if (Number.isNaN(num)) return Promise.reject(new Error("Must be a valid number (integers and decimals allowed)"));
                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input placeholder="0.0" />
                                </Form.Item>
                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)}>
                                  Remove
                                </Button>
                              </Card>
                            ))}
                            <Button type="dashed" onClick={() => add({ name: "", strength: 0 })} block icon={<PlusOutlined />}>
                              Add Lora
                            </Button>
                          </>
                        )}
                      </Form.List>
                    </Form.Item>
                  </>
                ),
              },
              {
                key: "custom",
                label: "Custom",
                children: (
                  <>
                    <Form.Item name="ncover" label="NSFW">
                      <Select options={[{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }]} />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Spin>
    </Modal>
  );
};

export default RoleEditModal;
