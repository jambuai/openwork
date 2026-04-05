import React from 'react';
import { Box, Text } from '../../ink.js';
import { loadOpenWorkAppearance, welcomeTitleLine } from '../../utils/openworkAppearance.js';
import { WelcomeV2AsciiFull } from './WelcomeV2.js';

/**
 * Welcome banner: respects ~/.openwork/appearance.json (name, prefix, accent, ASCII preset).
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
  return <WelcomeV2AsciiFull />;
}
