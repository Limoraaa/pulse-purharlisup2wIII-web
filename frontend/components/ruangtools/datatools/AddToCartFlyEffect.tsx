"use client";
// import node module libraries
import { IconTool } from "@tabler/icons-react";

export interface FlyAnimationItem {
  id: string;
  startX: number;
  startY: number;
}

interface AddToCartFlyEffectProps {
  animations: FlyAnimationItem[];
  onAnimationEnd: (id: string) => void;
}

// Posisi FAB Keranjang: fixed bottom 2rem, right 2rem, lebar 60px (lihat CartFAB.tsx)
const FAB_OFFSET_PX = 32 + 30; // 2rem (32px) + setengah lebar tombol (30px)

const AddToCartFlyEffect = ({
  animations,
  onAnimationEnd,
}: AddToCartFlyEffectProps) => {
  if (animations.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes rtFlyToCart {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translate(var(--rt-fly-x), var(--rt-fly-y)) scale(0.3); opacity: 0; }
        }
        .rt-fly-item {
          position: fixed;
          z-index: 1080;
          pointer-events: none;
          animation: rtFlyToCart 0.55s cubic-bezier(0.3, 0.6, 0.5, 1) forwards;
        }
      `}</style>
      {animations.map((anim) => {
        const targetX = window.innerWidth - FAB_OFFSET_PX;
        const targetY = window.innerHeight - FAB_OFFSET_PX;
        const deltaX = targetX - anim.startX;
        const deltaY = targetY - anim.startY;
        return (
          <div
            key={anim.id}
            className="rt-fly-item"
            style={
              {
                left: anim.startX,
                top: anim.startY,
                "--rt-fly-x": `${deltaX}px`,
                "--rt-fly-y": `${deltaY}px`,
              } as React.CSSProperties
            }
            onAnimationEnd={() => onAnimationEnd(anim.id)}
          >
            <div
              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow"
              style={{ width: 30, height: 30 }}
            >
              <IconTool size={16} />
            </div>
          </div>
        );
      })}
    </>
  );
};

export default AddToCartFlyEffect;
