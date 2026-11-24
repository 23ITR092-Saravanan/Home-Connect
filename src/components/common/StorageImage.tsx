import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { APP_IMAGES, resolveBundledAssetUrl } from '../../assets/cartoonAssets';

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storagePath?: string;
  fallbackSrc?: string;
}

export const StorageImage: React.FC<StorageImageProps> = ({
  src,
  storagePath,
  fallbackSrc = APP_IMAGES.handcraftedPottery,
  alt = 'Marketplace Image',
  className = '',
  ...props
}) => {
  const resolvedFallback = resolveBundledAssetUrl(fallbackSrc) || APP_IMAGES.handcraftedPottery;
  const resolvedSrc = resolveBundledAssetUrl(src);

  const isRenderableUrl = (val?: string) =>
    !!val &&
    !val.startsWith('data:') &&
    (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('blob:') || val.startsWith('/'));

  const targetPath = storagePath || resolvedSrc || '';
  const initialSafeUrl = isRenderableUrl(targetPath)
    ? targetPath
    : isRenderableUrl(resolvedSrc)
    ? resolvedSrc
    : resolvedFallback;

  const [resolvedUrl, setResolvedUrl] = useState<string>(initialSafeUrl);

  useEffect(() => {
    let isMounted = true;
    const safeSrc = isRenderableUrl(resolvedSrc) ? resolvedSrc : resolvedFallback;

    if (!targetPath) {
      setResolvedUrl(resolvedFallback);
      return;
    }

    if (isRenderableUrl(targetPath)) {
      setResolvedUrl(targetPath);
      return;
    }

    // Resolve private Supabase Storage signed URL
    StorageService.getSignedUrl(targetPath)
      .then((url) => {
        if (!isMounted) return;
        if (isRenderableUrl(url)) {
          setResolvedUrl(url);
        } else {
          setResolvedUrl(safeSrc);
        }
      })
      .catch(() => {
        if (isMounted) setResolvedUrl(safeSrc);
      });

    return () => {
      isMounted = false;
    };
  }, [targetPath, resolvedSrc, resolvedFallback]);

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => {
        if (isRenderableUrl(resolvedSrc) && resolvedUrl !== resolvedSrc) {
          setResolvedUrl(resolvedSrc);
        } else if (resolvedUrl !== resolvedFallback) {
          setResolvedUrl(resolvedFallback);
        }
      }}
      {...props}
    />
  );
};
