import { type SanityConfig } from "@sanity/sdk";
import { SanityApp } from "@sanity/sdk-react";
import { Card, Flex, Spinner, ThemeProvider } from "@sanity/ui";
import { buildTheme } from "@sanity/ui/theme";
import { CuratorsDesk } from "./CuratorsDesk";

const theme = buildTheme();

export const PROJECT_ID = "wa27n68e";
export const DATASET = "production_1";

const config: SanityConfig[] = [{ projectId: PROJECT_ID, dataset: DATASET }];

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <SanityApp
        config={config}
        fallback={
          <Flex align="center" justify="center" height="fill" padding={6}>
            <Spinner muted />
          </Flex>
        }
      >
        <Card height="fill" overflow="auto">
          <CuratorsDesk />
        </Card>
      </SanityApp>
    </ThemeProvider>
  );
}
