const easeOut = [0, 0, 0.2, 1];

export function drawerMotion(placement = "right") {
  const axis = placement === "left" || placement === "right" ? "x" : "y";
  const hidden = placement === "top" || placement === "left" ? "-100%" : "100%";
  const slide = { duration: 0.22, ease: easeOut };
  return {
    variants: {
      enter: {
        [axis]: 0,
        transition: { [axis]: slide },
      },
      exit: {
        [axis]: hidden,
        transition: { [axis]: slide },
      },
    },
  };
}

export const rightDrawerMotion = drawerMotion("right");
