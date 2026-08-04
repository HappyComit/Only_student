import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  // Recommended number of grid columns for product / service cards
  const columns = isDesktop ? 3 : isTablet ? 2 : 1;

  return {
    width,
    height,
    isDesktop,
    isTablet,
    isMobile,
    columns,
    contentStyle: {
      maxWidth: 1100,
      width: '100%' as const,
      alignSelf: 'center' as const,
    },
    authContainerStyle: {
      maxWidth: 480,
      width: '100%' as const,
      alignSelf: 'center' as const,
    },
    formContainerStyle: {
      maxWidth: 720,
      width: '100%' as const,
      alignSelf: 'center' as const,
    },
  };
}
