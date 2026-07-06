import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Button, Select, Upload, Image, Spin, message, Row, Col, Input, InputNumber, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './index.module.less';
import { getHomeDisplayConfigApi, updateHomeDisplayConfigApi, type HomeDisplayConfig, type HomeDisplayCarouselSlot } from '@/apis/home-display';
import { uploadImageApi } from '@/apis';
import { fetchOPSRolesApi } from '@/apis/role';
import { usePermission } from '@/hooks/permission';

const DEFAULT_BANNER_URL = 'https://my-bucket.s3.amazonaws.com/banner.webp';
const SEARCH_DEBOUNCE_MS = 300;

function emptyCarouselSlot(): HomeDisplayCarouselSlot {
  return { character_id: '' };
}

type CharacterOption = { id: string; nickname: string; avatar_url: string };

export default function HomeDisplayConfig() {
  const [loading, setLoading] = useState(true);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [config, setConfig] = useState<HomeDisplayConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'banner' | 'carousel'>('banner');
  const [characterSearchOptions, setCharacterSearchOptions] = useState<CharacterOption[]>([]);
  const [characterSearchLoading, setCharacterSearchLoading] = useState(false);
  const [characterSearchQuery, setCharacterSearchQuery] = useState('');
  const [characterCache, setCharacterCache] = useState<Record<string, CharacterOption>>({});
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission('configs_image_params_edit');

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getHomeDisplayConfigApi();
      const c = res && typeof res === 'object'
        ? {
            banner: res.banner ?? { images: [{ url: DEFAULT_BANNER_URL }] },
            carousel: res.carousel ?? { slots: [] },
            top_character_ids: Array.isArray(res.top_character_ids) ? res.top_character_ids : []
          }
        : {
            banner: { images: [{ url: DEFAULT_BANNER_URL }] },
            carousel: { slots: [] },
            top_character_ids: [] as string[]
          };
      setConfig(c);
    } catch (e) {
      messageApi.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Remote search: when user types in character Select, search backend by name (e.g. "Claudia Fernandez")
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      (async () => {
        setCharacterSearchLoading(true);
        try {
          const res = await fetchOPSRolesApi({
            page: 0,
            size: 100,
            q: characterSearchQuery.trim() || undefined
          });
          const data = res?.data ?? [];
          setCharacterSearchOptions(data);
          setCharacterCache((prev) => {
            const next = { ...prev };
            data.forEach((c) => { next[c.id] = c; });
            return next;
          });
        } catch {
          setCharacterSearchOptions([]);
        } finally {
          setCharacterSearchLoading(false);
        }
      })();
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [characterSearchQuery]);

  const getCharacterById = useCallback((id: string): CharacterOption | undefined => {
    return characterCache[id] ?? characterSearchOptions.find((c) => c.id === id);
  }, [characterCache, characterSearchOptions]);

  const getCharacterSelectOptions = useCallback((selectedId: string | undefined) => {
    const base = characterSearchOptions.map((c) => ({ value: c.id, label: c.nickname || c.id }));
    if (selectedId && !base.some((o) => o.value === selectedId)) {
      const cached = characterCache[selectedId];
      return [{ value: selectedId, label: cached?.nickname ?? selectedId }, ...base];
    }
    return base;
  }, [characterSearchOptions, characterCache]);

  const handleBannerUrlChange = (url: string) => {
    if (!config) return;
    setConfig({
      ...config,
      banner: { images: [{ url: url.trim() || DEFAULT_BANNER_URL }] }
    });
  };

  const handleBannerImageUpload = async (file: File) => {
    if (!canEdit || !config) return false;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      messageApi.error('请上传 PNG、JPG 或 WebP 图片');
      return false;
    }
    try {
      const res = await uploadImageApi(file);
      const url = res?.url;
      if (url) {
        setConfig({
          ...config,
          banner: { images: [{ url }] }
        });
        messageApi.success('Banner 图片已更新，请点击保存');
      }
    } catch {
      messageApi.error('上传失败');
    }
    return false; // prevent default upload
  };

  const handleCarouselSlotChange = (index: number, field: keyof HomeDisplayCarouselSlot, value: string | number | undefined) => {
    if (!config) return;
    const slots = [...(config.carousel.slots ?? [])];
    while (slots.length <= index) slots.push(emptyCarouselSlot());
    const slot = { ...slots[index], [field]: value === '' ? undefined : value };
    slots[index] = slot;
    setConfig({ ...config, carousel: { slots } });
  };

  const handleCarouselAddSlot = () => {
    if (!config) return;
    const slots = [...(config.carousel.slots ?? []), emptyCarouselSlot()];
    setConfig({ ...config, carousel: { slots } });
  };

  const handleCarouselRemoveSlot = (index: number) => {
    if (!config) return;
    const slots = (config.carousel.slots ?? []).filter((_, i) => i !== index);
    setConfig({ ...config, carousel: { slots } });
  };

  const handleCarouselSlotImageUpload = async (index: number, file: File) => {
    if (!canEdit || !config) return;
    try {
      const res = await uploadImageApi(file);
      const url = res?.url;
      if (url) {
        const slots = [...(config.carousel.slots ?? [])];
        while (slots.length <= index) slots.push(emptyCarouselSlot());
        slots[index] = { ...slots[index], image_url: url };
        setConfig({ ...config, carousel: { slots } });
        messageApi.success('轮盘图片已更新，请点击保存');
      }
    } catch {
      messageApi.error('上传失败');
    }
    return false;
  };

  const buildFullPayload = useCallback((): HomeDisplayConfig => {
    if (!config) return { banner: { images: [] }, carousel: { slots: [] }, top_character_ids: [] };
    const slots = (config.carousel.slots ?? [])
      .map((s) => ({
        character_id: (s.character_id ?? '').trim(),
        image_url: (s.image_url ?? '').trim() || undefined,
        title: (s.title ?? '').trim() || undefined,
        link: (s.link ?? '').trim() || undefined,
        order: s.order != null && Number.isFinite(Number(s.order)) ? Number(s.order) : undefined
      }))
      .filter((s) => s.character_id);
    return {
      banner: config.banner,
      carousel: { slots },
      top_character_ids: config.top_character_ids ?? []
    };
  }, [config]);

  const handleSaveBanner = async () => {
    if (!canEdit || !config) {
      messageApi.warning('无权限编辑');
      return;
    }
    const expectedBannerUrl = config.banner?.images?.[0]?.url;
    try {
      setSavingBanner(true);
      const updated = await updateHomeDisplayConfigApi(buildFullPayload());
      const savedUrl = updated?.banner?.images?.[0]?.url;
      if (updated && savedUrl) {
        setConfig((prev) => (prev ? { ...prev, banner: updated.banner, carousel: updated.carousel ?? prev.carousel, top_character_ids: updated.top_character_ids ?? prev.top_character_ids } : prev));
        if (savedUrl === expectedBannerUrl) {
          messageApi.success('Banner 保存成功');
        } else {
          messageApi.success('已保存');
        }
      } else {
        messageApi.warning('保存可能未生效：未返回有效配置，请刷新检查');
        await loadConfig();
      }
    } catch {
      messageApi.error('保存失败');
      await loadConfig();
    } finally {
      setSavingBanner(false);
    }
  };

  const handleSaveCarousel = async () => {
    if (!canEdit || !config) {
      messageApi.warning('无权限编辑');
      return;
    }
    try {
      setSavingCarousel(true);
      const updated = await updateHomeDisplayConfigApi(buildFullPayload());
      if (updated && typeof updated.carousel === 'object') {
        setConfig((prev) => (prev ? { ...prev, banner: updated.banner ?? prev.banner, carousel: updated.carousel, top_character_ids: updated.top_character_ids ?? prev.top_character_ids } : prev));
        messageApi.success('轮盘配置保存成功');
      } else {
        messageApi.warning('保存可能未生效：未返回有效配置，请刷新检查');
        await loadConfig();
      }
    } catch {
      messageApi.error('保存失败');
      await loadConfig();
    } finally {
      setSavingCarousel(false);
    }
  };

  if (loading || !config) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  const bannerUrl = config.banner?.images?.[0]?.url || DEFAULT_BANNER_URL;
  const carouselSlots = config.carousel?.slots ?? [];

  const bannerTab = (
    <div style={{ padding: '8px 0' }}>
      <p style={{ marginBottom: 16, color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
        首页顶部横幅图：可填写图片 URL，或上传 PNG / JPG / WebP（上传后需点击「保存 Banner」）。默认：{DEFAULT_BANNER_URL}
      </p>
      <Row gutter={16} align="top">
        <Col flex="0 0 320px">
          <div style={{ marginBottom: 8 }}>Banner 图片 URL</div>
          <Input
            value={bannerUrl}
            onChange={(e) => handleBannerUrlChange(e.target.value)}
            placeholder={DEFAULT_BANNER_URL}
            disabled={!canEdit}
            allowClear
            style={{ width: '100%' }}
          />
          {canEdit && (
            <div style={{ marginTop: 8 }}>
              <Upload
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                showUploadList={false}
                beforeUpload={(file) => handleBannerImageUpload(file)}
              >
                <Button type="default">上传 PNG / JPG</Button>
              </Upload>
            </div>
          )}
        </Col>
        <Col>
          <div style={{ marginBottom: 8 }}>预览</div>
          <div style={{ width: 200, height: 80, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="banner preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: '#999' }}>输入 URL 后预览</span>
            )}
          </div>
        </Col>
      </Row>
      {canEdit && (
        <Button type="primary" onClick={handleSaveBanner} loading={savingBanner} style={{ marginTop: 16 }}>
          保存 Banner
        </Button>
      )}
    </div>
  );

  const carouselTab = (
    <div style={{ padding: '8px 0' }}>
      <p style={{ marginBottom: 16, color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
        设置首页轮盘显示的角色与顺序；可添加/删除条目，并为每条设置角色、图片、标题、链接、排序。
      </p>
      {(carouselSlots.length === 0 ? [emptyCarouselSlot()] : carouselSlots).map((slot, i) => {
        const char = getCharacterById(slot.character_id);
        const displayUrl = slot.image_url || char?.avatar_url;
        const isPlaceholder = carouselSlots.length === 0 && i === 0;
        return (
          <div key={i} style={{ marginBottom: 16, padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
            <Row gutter={12} align="middle" wrap>
              <Col><strong>#{i + 1}</strong></Col>
              <Col>
                <Select
                  placeholder="输入角色名搜索 (如 Claudia Fernandez)"
                  value={slot.character_id || undefined}
                  onChange={(v) => handleCarouselSlotChange(i, 'character_id', v ?? '')}
                  style={{ width: 220 }}
                  disabled={!canEdit}
                  loading={characterSearchLoading}
                  showSearch
                  filterOption={false}
                  onSearch={(v) => setCharacterSearchQuery(v)}
                  options={getCharacterSelectOptions(slot.character_id || undefined)}
                  notFoundContent={characterSearchLoading ? '搜索中...' : '输入名称搜索角色'}
                />
              </Col>
              <Col>
                {displayUrl && (
                  <Image src={displayUrl} alt="" width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
                )}
              </Col>
              {canEdit && (
                <Col>
                  <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => { handleCarouselSlotImageUpload(i, file); return false; }}>
                    <Button size="small">上传图片</Button>
                  </Upload>
                </Col>
              )}
              <Col>
                <Input
                  placeholder="标题 (可选)"
                  value={slot.title ?? ''}
                  onChange={(e) => handleCarouselSlotChange(i, 'title', e.target.value)}
                  style={{ width: 120 }}
                  disabled={!canEdit}
                />
              </Col>
              <Col>
                <Input
                  placeholder="链接 (可选)"
                  value={slot.link ?? ''}
                  onChange={(e) => handleCarouselSlotChange(i, 'link', e.target.value)}
                  style={{ width: 180 }}
                  disabled={!canEdit}
                />
              </Col>
              <Col>
                <InputNumber
                  placeholder="排序"
                  value={slot.order}
                  onChange={(v) => handleCarouselSlotChange(i, 'order', v ?? undefined)}
                  min={0}
                  style={{ width: 80 }}
                  disabled={!canEdit}
                />
              </Col>
              {canEdit && (carouselSlots.length > 0 || !isPlaceholder) && (
                <Col>
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleCarouselRemoveSlot(i)} />
                </Col>
              )}
            </Row>
          </div>
        );
      })}
      {canEdit && (
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleCarouselAddSlot} style={{ marginTop: 8 }}>
          添加轮盘位
        </Button>
      )}
      {canEdit && (
        <Button type="primary" onClick={handleSaveCarousel} loading={savingCarousel} style={{ marginTop: 16 }}>
          保存轮盘配置
        </Button>
      )}
    </div>
  );

  return (
    <>
      {contextHolder}
      <div className={styles.wrapper}>
        <Card className={styles.card} styles={{ body: { padding: 12 } }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'banner' | 'carousel')}
            items={[
              { key: 'banner', label: '首页 Banner 配置', children: bannerTab },
              { key: 'carousel', label: '轮盘图片配置', children: carouselTab },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
