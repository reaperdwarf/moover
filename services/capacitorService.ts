// In a real app, these would import from @capacitor/core, @capacitor/camera, etc.

export const HapticsService = {
  impact: async (style: 'LIGHT' | 'MEDIUM' | 'HEAVY' = 'MEDIUM') => {
    console.log(`[Haptics] Impact: ${style}`);
    if (navigator.vibrate) {
      navigator.vibrate(style === 'HEAVY' ? 50 : 20);
    }
  },
  notification: async (type: 'SUCCESS' | 'WARNING' | 'ERROR') => {
    console.log(`[Haptics] Notification: ${type}`);
    if (navigator.vibrate) {
      navigator.vibrate(type === 'SUCCESS' ? [50, 50, 50] : 200);
    }
  }
};

export const CameraService = {
  takePhoto: async (): Promise<string> => {
    console.log('[Camera] Opening camera...');
    // Mocking a camera result for browser demo
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("https://picsum.photos/800/600"); // Return a placeholder as the "photo"
      }, 1000);
    });
  }
};

export const GeolocationService = {
  getCurrentPosition: async (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error("[Geolocation] Error", error);
            // Fallback for demo if permission denied
            resolve({ lat: 40.7128, lng: -74.0060 }); // NYC
          }
        );
      } else {
        resolve({ lat: 40.7128, lng: -74.0060 });
      }
    });
  }
};