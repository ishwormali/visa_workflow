export const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      className="visa-design-app relative min-h-screen bg-(--paper) font-visa-ui text-[15px] leading-[1.5] text-(--ink) antialiased"
      data-theme="warm"
      data-density="spacious"
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(140, 90, 40, 0.025), transparent 50%), radial-gradient(circle at 80% 90%, rgba(40, 60, 120, 0.020), transparent 50%)",
        }}
      />
      {children}
    </div>
  );
};
