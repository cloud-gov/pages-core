export const REFETCH_INTERVAL = 10000;

export const shouldScrollIntoView = (ref) => {
  const offset = Math.abs(ref.current.offsetTop - window.scrollY);

  if (offset > 200) {
    return ref.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  return Promise.resolve();
};
