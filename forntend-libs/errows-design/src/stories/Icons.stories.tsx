import type { Meta, StoryObj } from "@storybook/react";
import * as Icons from "@errows/icons";
import { useState } from "react";

const iconEntries = Object.entries(Icons);

const IconGallery = () => {
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

  const copyToClipboard = async (iconName: string) => {
    const importStatement = `import { ${iconName} } from '@errows/icons';`;
    try {
      await navigator.clipboard.writeText(importStatement);
      setCopiedIcon(iconName);
      setTimeout(() => setCopiedIcon(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px", color: "#333" }}>Icons Gallery</h1>
      <p style={{ marginBottom: "30px", color: "#666" }}>
        Total Icons: {iconEntries.length}. Click any icon to copy its import
        statement.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: "12px",
        }}
      >
        {iconEntries.map(([name, IconComponent]) => {
          if (typeof IconComponent !== "function") return null;

          return (
            <div
              key={name}
              onClick={() => copyToClipboard(name)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "12px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: copiedIcon === name ? "#e8f5e9" : "#fff",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{ width: "32px", height: "32px", marginBottom: "8px" }}
              >
                <IconComponent style={{ width: "100%", height: "100%", color: "#333" }} />
              </div>
              <div
                style={{
                  fontSize: "11px",
                  textAlign: "center",
                  color: "#555",
                  width: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </div>
              {copiedIcon === name && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "11px",
                    color: "#4caf50",
                    fontWeight: "bold",
                  }}
                >
                  ✓ Copied!
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const meta: Meta<typeof IconGallery> = {
  title: "Foundation/Icons",
  component: IconGallery,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof IconGallery>;

export const AllIcons: Story = {};
