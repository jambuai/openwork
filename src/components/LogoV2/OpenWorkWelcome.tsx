import React from 'react';
import { Box, Text } from '../../ink.js';
import {
  loadOpenWorkAppearance,
  type OpenWorkAppearanceV1,
  welcomeTitleLine,
} from '../../utils/openworkAppearance.js';
import { WelcomeV2AsciiFull } from './WelcomeV2.js';

function CustomAsciiWelcome({ a }: { a: OpenWorkAppearanceV1 }): React.ReactNode {
  const line = welcomeTitleLine(a);
  const ver = MACRO.DISPLAY_VERSION ?? MACRO.VERSION;
  const lines = a.asciiArtLines;
  const titleBlock = (
    <Box flexDirection="column">
      <Text bold>
        {line}
        <Text dimColor> v{ver}</Text>
      </Text>
    </Box>
  );
  if (lines.length === 0) {
    return (
      <Box flexDirection="column" marginY={1}>
        {titleBlock}
      </Box>
    );
  }
  return (
    <Box flexDirection="row" gap={2} marginY={1}>
      <Box flexDirection="column">
        {lines.map((l, i) => (
          <Text key={i} color={a.accentColor}>
            {l}
          </Text>
        ))}
      </Box>
      <Box flexDirection="column" justifyContent="flex-start">
        {titleBlock}
      </Box>
    </Box>
  );
}

/**
 * Welcome banner: respects ~/.openwork/appearance.json (name, prefix, accent, ASCII preset / custom art).
 */
export function WelcomeV2(): React.ReactNode {
  const a = loadOpenWorkAppearance();
  const line = welcomeTitleLine(a);
  const ver = MACRO.DISPLAY_VERSION ?? MACRO.VERSION;
  if (a.asciiPreset === 'none') {
    return (
      <Box flexDirection="column" marginY={1}>
        <Text>
          <Text color={a.accentColor}>{line}</Text>
          <Text dimColor> v{ver}</Text>
        </Text>
      </Box>
    );
  }
  if (a.asciiPreset === 'minimal') {
    return (
      <Box
        borderStyle="round"
        borderColor="ide"
        flexDirection="column"
        paddingX={1}
        paddingY={1}
        marginY={1}
      >
        <Text>
          <Text bold color={a.accentColor}>
            {line}
          </Text>
        </Text>
        <Text dimColor>v{ver}</Text>
      </Box>
    );
  }
  if (a.asciiPreset === 'custom') {
    return <CustomAsciiWelcome a={a} />;
  }
  return <WelcomeV2AsciiFull />;
}
