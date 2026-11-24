import buyerCartoonImg from './images/buyer_cartoon_1793696291526.jpg';
import buyerCartoonSceneImg from './images/buyer_cartoon_scene_1793698268270.jpg';
import cartoonMarketplaceHeroImg from './images/cartoon_marketplace_hero_1793696015023.jpg';
import customCraftImg from './images/custom_craft_1793696320082.jpg';
import handcraftedPotteryImg from './images/handcrafted_pottery_1793425001050.jpg';
import handloomCottonTextileImg from './images/handloom_cotton_textile_1793425001285.jpg';
import homeConnectHeroImg from './images/home_connect_hero_1793425000180.jpg';
import organicRawHoneyImg from './images/organic_raw_honey_1793425001713.jpg';
import sellerCartoonImg from './images/seller_cartoon_1793696305775.jpg';
import sellerCartoonSceneImg from './images/seller_cartoon_scene_1793698284106.jpg';

export const APP_IMAGES = {
  buyerCartoon: buyerCartoonImg,
  buyerCartoonScene: buyerCartoonSceneImg,
  cartoonMarketplaceHero: cartoonMarketplaceHeroImg,
  customCraft: customCraftImg,
  handcraftedPottery: handcraftedPotteryImg,
  handloomCottonTextile: handloomCottonTextileImg,
  homeConnectHero: homeConnectHeroImg,
  organicRawHoney: organicRawHoneyImg,
  sellerCartoon: sellerCartoonImg,
  sellerCartoonScene: sellerCartoonSceneImg,
} as const;

const LEGACY_ASSET_MAP: Record<string, string> = {
  '/src/assets/images/buyer_cartoon_1793696291526.jpg': buyerCartoonImg,
  '/src/assets/images/buyer_cartoon_scene_1793698268270.jpg': buyerCartoonSceneImg,
  '/src/assets/images/cartoon_marketplace_hero_1793696015023.jpg': cartoonMarketplaceHeroImg,
  '/src/assets/images/custom_craft_1793696320082.jpg': customCraftImg,
  '/src/assets/images/handcrafted_pottery_1793425001050.jpg': handcraftedPotteryImg,
  '/src/assets/images/handloom_cotton_textile_1793425001285.jpg': handloomCottonTextileImg,
  '/src/assets/images/home_connect_hero_1793425000180.jpg': homeConnectHeroImg,
  '/src/assets/images/organic_raw_honey_1793425001713.jpg': organicRawHoneyImg,
  '/src/assets/images/seller_cartoon_1793696305775.jpg': sellerCartoonImg,
  '/src/assets/images/seller_cartoon_scene_1793698284106.jpg': sellerCartoonSceneImg,
};

/**
 * Resolves any legacy `/src/assets/images/...` path to the Vite-bundled asset URL
 * so production builds and downloaded ZIPs always render images reliably.
 */
export function resolveBundledAssetUrl(url?: string): string {
  if (!url) return '';
  return LEGACY_ASSET_MAP[url] || url;
}
