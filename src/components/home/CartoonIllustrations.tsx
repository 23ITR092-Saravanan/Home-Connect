import React from 'react';

/**
 * Clean, delightful vector cartoon illustration of a cheerful neighborhood buyer.
 * Features a clearly visible, smiling cartoon face, expressive cartoon eyes,
 * shopping craft bag, and artisan honey jar. 100% scalable vector artwork.
 */
export const BuyerCartoon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Happy Buyer Cartoon Illustration"
    >
      <defs>
        <linearGradient id="buyerBg" x1="0" y1="0" x2="400" y2="320" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF3C7" />
          <stop offset="0.5" stopColor="#FDE68A" />
          <stop offset="1" stopColor="#F59E0B" stopOpacity="0.25" />
        </linearGradient>

        <linearGradient id="hairGrad" x1="160" y1="40" x2="240" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6B3410" />
          <stop offset="1" stopColor="#451A03" />
        </linearGradient>

        <linearGradient id="skinGrad" x1="170" y1="70" x2="230" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFEDD5" />
          <stop offset="1" stopColor="#FED7AA" />
        </linearGradient>

        <linearGradient id="sweaterGrad" x1="140" y1="180" x2="260" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>

        <linearGradient id="bagGrad" x1="260" y1="210" x2="330" y2="290" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E2BA84" />
          <stop offset="1" stopColor="#C89759" />
        </linearGradient>

        <linearGradient id="honeyGrad" x1="75" y1="220" x2="115" y2="270" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>

        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#92400E" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Backdrop Card Canvas */}
      <rect width="400" height="320" rx="24" fill="url(#buyerBg)" />

      {/* Decorative Warm Background Circles & Sparkles */}
      <circle cx="200" cy="140" r="110" fill="#FFFFFF" fillOpacity="0.6" />
      <circle cx="70" cy="70" r="35" fill="#FDE68A" fillOpacity="0.5" />
      <circle cx="340" cy="80" r="28" fill="#FDE68A" fillOpacity="0.6" />

      {/* Little Star Sparkles */}
      <path d="M60 110L63 118L71 121L63 124L60 132L57 124L49 121L57 118Z" fill="#F59E0B" />
      <path d="M335 130L338 136L344 138L338 140L335 146L332 140L326 138L332 136Z" fill="#EA580C" />
      <path d="M120 45L122 49L126 51L122 53L120 57L118 53L114 51L118 49Z" fill="#F59E0B" />
      <path d="M290 40L292 45L297 47L292 49L290 54L288 49L283 47L288 45Z" fill="#F59E0B" />

      {/* BACK HAIR */}
      <ellipse cx="200" cy="120" rx="64" ry="70" fill="url(#hairGrad)" />

      {/* NECK */}
      <rect x="187" y="152" width="26" height="28" rx="6" fill="#FDBA74" />

      {/* SHOULDERS & SWEATER BODY */}
      <g filter="url(#softShadow)">
        {/* Yellow Cardigan */}
        <path
          d="M142 195 C142 178, 170 172, 200 172 C230 172, 258 178, 258 195 L268 320 L132 320 Z"
          fill="url(#sweaterGrad)"
        />

        {/* Cardigan Collar / Inner Tee with sailor stripes */}
        <path d="M180 172 L200 216 L220 172 Z" fill="#FFFFFF" />
        <path d="M185 183 L215 183" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
        <path d="M190 196 L210 196" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
        <path d="M195 208 L205 208" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />

        {/* Buttons on Cardigan */}
        <circle cx="200" cy="235" r="3.5" fill="#78350F" />
        <circle cx="200" cy="255" r="3.5" fill="#78350F" />
        <circle cx="200" cy="275" r="3.5" fill="#78350F" />
      </g>

      {/* EARS */}
      <circle cx="152" cy="118" r="10" fill="url(#skinGrad)" />
      <circle cx="152" cy="118" r="4" fill="#FDBA74" />
      {/* Earring */}
      <circle cx="152" cy="129" r="3" fill="#F59E0B" />

      <circle cx="248" cy="118" r="10" fill="url(#skinGrad)" />
      <circle cx="248" cy="118" r="4" fill="#FDBA74" />
      {/* Earring */}
      <circle cx="248" cy="129" r="3" fill="#F59E0B" />

      {/* FACE - FULLY VISIBLE & PROMINENT */}
      <ellipse cx="200" cy="118" rx="46" ry="50" fill="url(#skinGrad)" filter="url(#softShadow)" />

      {/* CHEEKS (Rosy blush) */}
      <ellipse cx="170" cy="130" rx="9" ry="6" fill="#FCA5A5" fillOpacity="0.65" />
      <ellipse cx="230" cy="130" rx="9" ry="6" fill="#FCA5A5" fillOpacity="0.65" />

      {/* FRECKLES */}
      <circle cx="172" cy="125" r="1.2" fill="#C2410C" />
      <circle cx="176" cy="127" r="1" fill="#C2410C" />
      <circle cx="228" cy="125" r="1.2" fill="#C2410C" />
      <circle cx="224" cy="127" r="1" fill="#C2410C" />

      {/* BIG EXPRESSIVE CARTOON EYES */}
      {/* Left Eye */}
      <g>
        {/* Eyebrow */}
        <path d="M165 92 Q176 86 186 92" stroke="#451A03" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Eye Outline */}
        <ellipse cx="176" cy="108" rx="9" ry="11" fill="#FFFFFF" />
        {/* Iris */}
        <ellipse cx="177" cy="108" rx="6.5" ry="8.5" fill="#451A03" />
        {/* Pupil */}
        <ellipse cx="177" cy="108" rx="4" ry="5" fill="#1C1917" />
        {/* Catchlight sparkle */}
        <circle cx="175" cy="104" r="2.8" fill="#FFFFFF" />
        <circle cx="179" cy="111" r="1.4" fill="#FFFFFF" />
        {/* Eyelashes */}
        <path d="M168 100 Q176 96 184 100" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>

      {/* Right Eye */}
      <g>
        {/* Eyebrow */}
        <path d="M214 92 Q224 86 235 92" stroke="#451A03" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Eye Outline */}
        <ellipse cx="224" cy="108" rx="9" ry="11" fill="#FFFFFF" />
        {/* Iris */}
        <ellipse cx="223" cy="108" rx="6.5" ry="8.5" fill="#451A03" />
        {/* Pupil */}
        <ellipse cx="223" cy="108" rx="4" ry="5" fill="#1C1917" />
        {/* Catchlight sparkle */}
        <circle cx="221" cy="104" r="2.8" fill="#FFFFFF" />
        <circle cx="225" cy="111" r="1.4" fill="#FFFFFF" />
        {/* Eyelashes */}
        <path d="M216 100 Q224 96 232 100" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>

      {/* CUTE NOSE */}
      <path d="M197 116 Q200 120 203 116" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* HAPPY SMILING MOUTH */}
      <path
        d="M185 132 Q200 152 215 132 Z"
        fill="#DC2626"
        stroke="#991B1B"
        strokeWidth="1.5"
      />
      {/* Tongue */}
      <path d="M192 144 Q200 148 208 144 Q200 140 192 144 Z" fill="#F87171" />
      {/* Upper white teeth sparkle */}
      <path d="M188 133 Q200 137 212 133" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

      {/* FRONT HAIR & BANGS */}
      <path
        d="M152 100 C150 65, 175 52, 200 52 C228 52, 248 68, 248 100 C240 85, 225 80, 208 84 C192 88, 170 82, 152 100 Z"
        fill="url(#hairGrad)"
      />
      {/* Cute curly hair strands on side */}
      <path d="M154 98 C144 115, 142 145, 150 162 C154 148, 156 120, 154 98 Z" fill="url(#hairGrad)" />
      <path d="M246 98 C256 115, 258 145, 250 162 C246 148, 244 120, 246 98 Z" fill="url(#hairGrad)" />

      {/* Cute Headband */}
      <path
        d="M156 86 C165 65, 235 65, 244 86"
        stroke="#EA580C"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Headband bow / knot */}
      <circle cx="178" cy="67" r="7" fill="#EA580C" />
      <circle cx="178" cy="67" r="3.5" fill="#FED7AA" />

      {/* LEFT HAND & HONEY JAR */}
      <g filter="url(#softShadow)">
        {/* Honey Jar Body */}
        <rect x="74" y="222" width="44" height="52" rx="8" fill="url(#honeyGrad)" />
        {/* Glass shine */}
        <rect x="78" y="226" width="6" height="42" rx="3" fill="#FFFFFF" fillOpacity="0.5" />
        {/* Cloth Cover with string */}
        <path d="M70 220 C70 215, 122 215, 122 220 L126 226 L66 226 Z" fill="#DC2626" />
        <ellipse cx="96" cy="226" rx="28" ry="4" fill="#B91C1C" />
        <rect x="80" y="227" width="32" height="3" rx="1.5" fill="#451A03" />
        {/* Label */}
        <rect x="80" y="240" width="32" height="24" rx="4" fill="#FEF3C7" />
        <text x="96" y="251" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#92400E">
          HONEY
        </text>
        <circle cx="96" cy="258" r="3" fill="#F59E0B" />
        {/* Left hand holding jar */}
        <ellipse cx="120" cy="252" rx="10" ry="12" fill="url(#skinGrad)" />
        <circle cx="118" cy="245" r="4" fill="url(#skinGrad)" />
        <circle cx="119" cy="253" r="4" fill="url(#skinGrad)" />
        <circle cx="118" cy="261" r="4" fill="url(#skinGrad)" />
      </g>

      {/* RIGHT HAND & SHOPPING CRAFT BAG */}
      <g filter="url(#softShadow)">
        {/* Bag Handles */}
        <path
          d="M292 210 C292 195, 318 195, 318 210"
          stroke="#92400E"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        {/* Bag Body */}
        <path d="M276 210 L334 210 L342 305 L268 305 Z" fill="url(#bagGrad)" />
        {/* Bag fold lines */}
        <path d="M284 210 L277 305" stroke="#B48248" strokeWidth="2" />
        <path d="M326 210 L333 305" stroke="#B48248" strokeWidth="2" />
        {/* Heart stamp on bag */}
        <circle cx="305" cy="255" r="14" fill="#FFFFFF" fillOpacity="0.85" />
        <path
          d="M305 262 C305 262 297 256 297 251 C297 248 300 246 302.5 246 C304 246 305 247 305 248 C305 247 306 246 307.5 246 C310 246 313 248 313 251 C313 256 305 262 305 262 Z"
          fill="#EA580C"
        />
        <text x="305" y="280" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#78350F">
          HOMEMADE
        </text>

        {/* Right Hand holding handle */}
        <ellipse cx="305" cy="202" rx="12" ry="9" fill="url(#skinGrad)" />
        <circle cx="298" cy="202" r="4" fill="url(#skinGrad)" />
        <circle cx="305" cy="202" r="4" fill="url(#skinGrad)" />
        <circle cx="312" cy="202" r="4" fill="url(#skinGrad)" />
      </g>
    </svg>
  );
};

/**
 * Clean, delightful vector cartoon illustration of a friendly craft artisan seller.
 * Features a smiling face, maker apron, clay pot & pottery wheel.
 */
export const SellerCartoon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Friendly Artisan Seller Cartoon Illustration"
    >
      <defs>
        <linearGradient id="sellerBg" x1="0" y1="0" x2="400" y2="320" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0F2FE" />
          <stop offset="0.5" stopColor="#BAE6FD" />
          <stop offset="1" stopColor="#0284C7" stopOpacity="0.25" />
        </linearGradient>

        <linearGradient id="curlyHair" x1="150" y1="40" x2="250" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#451A03" />
          <stop offset="1" stopColor="#1E1B4B" />
        </linearGradient>

        <linearGradient id="artisanSkin" x1="170" y1="70" x2="230" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFEDD5" />
          <stop offset="1" stopColor="#FED7AA" />
        </linearGradient>

        <linearGradient id="apronGrad" x1="150" y1="180" x2="250" y2="320" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D97706" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>

        <linearGradient id="potteryGrad" x1="280" y1="210" x2="340" y2="290" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB923C" />
          <stop offset="1" stopColor="#C2410C" />
        </linearGradient>
      </defs>

      {/* Backdrop Card Canvas */}
      <rect width="400" height="320" rx="24" fill="url(#sellerBg)" />

      {/* Studio Window & Sunbeam Circles */}
      <circle cx="200" cy="140" r="110" fill="#FFFFFF" fillOpacity="0.65" />
      <circle cx="65" cy="75" r="30" fill="#BAE6FD" fillOpacity="0.6" />
      <circle cx="340" cy="75" r="32" fill="#BAE6FD" fillOpacity="0.6" />

      {/* Studio Workshop Tools & Sparkles */}
      <path d="M55 120L58 126L64 128L58 130L55 136L52 130L46 128L52 126Z" fill="#0284C7" />
      <path d="M335 125L338 131L344 133L338 135L335 141L332 135L326 133L332 131Z" fill="#0369A1" />
      <path d="M125 45L127 49L131 51L127 53L125 57L123 53L119 51L123 49Z" fill="#0284C7" />

      {/* BACK HAIR (Cute Curly Volume) */}
      <circle cx="160" cy="90" r="32" fill="url(#curlyHair)" />
      <circle cx="240" cy="90" r="32" fill="url(#curlyHair)" />
      <circle cx="150" cy="125" r="28" fill="url(#curlyHair)" />
      <circle cx="250" cy="125" r="28" fill="url(#curlyHair)" />
      <circle cx="200" cy="75" r="40" fill="url(#curlyHair)" />

      {/* NECK */}
      <rect x="187" y="152" width="26" height="28" rx="6" fill="#FDBA74" />

      {/* SHIRT & APRON */}
      <g>
        {/* Inner Teal Shirt */}
        <path
          d="M142 195 C142 178, 170 172, 200 172 C230 172, 258 178, 258 195 L268 320 L132 320 Z"
          fill="#0369A1"
        />

        {/* Brown Craft Maker Apron */}
        <path
          d="M168 182 L232 182 L244 320 L156 320 Z"
          fill="url(#apronGrad)"
        />
        {/* Apron straps */}
        <path d="M174 182 L160 172" stroke="#92400E" strokeWidth="6" strokeLinecap="round" />
        <path d="M226 182 L240 172" stroke="#92400E" strokeWidth="6" strokeLinecap="round" />

        {/* Apron front pocket with tools */}
        <rect x="175" y="240" width="50" height="38" rx="6" fill="#92400E" />
        {/* Paintbrush & clay tool poking out */}
        <rect x="184" y="218" width="4" height="26" rx="2" fill="#E2BA84" />
        <polygon points="183,218 189,218 186,206" fill="#DC2626" />
        <rect x="196" y="214" width="4" height="30" rx="2" fill="#94A3B8" />
        <circle cx="198" cy="214" r="3" fill="#64748B" />
        <rect x="208" y="222" width="4" height="22" rx="2" fill="#E2BA84" />
      </g>

      {/* EARS */}
      <circle cx="152" cy="118" r="10" fill="url(#artisanSkin)" />
      <circle cx="248" cy="118" r="10" fill="url(#artisanSkin)" />

      {/* FACE */}
      <ellipse cx="200" cy="118" rx="46" ry="50" fill="url(#artisanSkin)" />

      {/* CHEEKS */}
      <ellipse cx="170" cy="130" rx="9" ry="6" fill="#FCA5A5" fillOpacity="0.65" />
      <ellipse cx="230" cy="130" rx="9" ry="6" fill="#FCA5A5" fillOpacity="0.65" />

      {/* STYLISH ARTISAN GLASSES */}
      <g>
        {/* Left Lens Frame */}
        <rect x="162" y="96" width="28" height="24" rx="8" stroke="#1E293B" strokeWidth="3" fill="#FFFFFF" fillOpacity="0.3" />
        {/* Right Lens Frame */}
        <rect x="210" y="96" width="28" height="24" rx="8" stroke="#1E293B" strokeWidth="3" fill="#FFFFFF" fillOpacity="0.3" />
        {/* Bridge */}
        <path d="M190 108 L210 108" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
        {/* Temples */}
        <path d="M162 108 L152 106" stroke="#1E293B" strokeWidth="2.5" />
        <path d="M238 108 L248 106" stroke="#1E293B" strokeWidth="2.5" />
      </g>

      {/* SMILING EYES BEHIND GLASSES */}
      <ellipse cx="176" cy="108" rx="4.5" ry="5.5" fill="#1E293B" />
      <circle cx="174" cy="106" r="1.8" fill="#FFFFFF" />
      <ellipse cx="224" cy="108" rx="4.5" ry="5.5" fill="#1E293B" />
      <circle cx="222" cy="106" r="1.8" fill="#FFFFFF" />

      {/* NOSE */}
      <path d="M197 116 Q200 120 203 116" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* WIDE CONFIDENT ARTISAN SMILE */}
      <path
        d="M184 132 Q200 154 216 132 Z"
        fill="#DC2626"
        stroke="#991B1B"
        strokeWidth="1.5"
      />
      <path d="M188 133 Q200 137 212 133" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />

      {/* FRONT CURLY HAIR STRANDS */}
      <circle cx="170" cy="72" r="12" fill="url(#curlyHair)" />
      <circle cx="188" cy="68" r="14" fill="url(#curlyHair)" />
      <circle cx="212" cy="68" r="14" fill="url(#curlyHair)" />
      <circle cx="230" cy="72" r="12" fill="url(#curlyHair)" />

      {/* CRAFT POTTERY / CERAMIC MUG IN HAND */}
      <g>
        {/* Ceramic Vase on Left */}
        <path
          d="M65 240 Q55 260 65 285 L95 285 Q105 260 95 240 Z"
          fill="url(#potteryGrad)"
        />
        <ellipse cx="80" cy="240" rx="15" ry="4" fill="#EA580C" />
        {/* Decorative floral pattern on vase */}
        <circle cx="80" cy="262" r="5" fill="#FEF3C7" />
        <circle cx="80" cy="262" r="2.5" fill="#0284C7" />

        {/* Finished Mug on Right Hand */}
        <rect x="290" y="235" width="36" height="42" rx="6" fill="#F8FAFC" />
        {/* Mug Handle */}
        <path d="M326 244 C336 244 336 266 326 266" stroke="#E2E8F0" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Heart on mug */}
        <path
          d="M308 262 C308 262 301 257 301 253 C301 250 304 248 306 248 C307.5 248 308 249 308 250 C308 249 308.5 248 310 248 C312 248 315 250 315 253 C315 257 308 262 308 262 Z"
          fill="#0284C7"
        />
        <text x="308" y="272" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#0284C7">
          SHOP
        </text>

        {/* Right Hand */}
        <ellipse cx="288" cy="255" rx="10" ry="12" fill="url(#artisanSkin)" />
      </g>
    </svg>
  );
};
