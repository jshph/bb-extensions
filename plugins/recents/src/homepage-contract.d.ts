import "@get-bb/plugin-sdk/app";

declare module "@get-bb/plugin-sdk/app" {
  interface PluginHomepageSectionProps {
    experimental_lastCreatedThreadId?: string | null;
  }
  interface PluginHomepageSectionRegistration {
    experimental_layout?: "section" | "flush";
  }
}
