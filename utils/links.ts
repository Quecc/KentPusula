import { Linking } from "react-native";
export async function openLink(
  url: string,
  onError: (message: string) => void,
) {
  try {
    if (!/^https:\/\//.test(url) && !/^tel:/.test(url))
      throw new Error("Unsafe URL");
    await Linking.openURL(url);
  } catch {
    onError(
      "Bağlantı açılamadı. İnternet bağlantını veya cihaz ayarlarını kontrol et.",
    );
  }
}
