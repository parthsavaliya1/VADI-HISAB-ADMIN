export default function HubFooter() {
  return (
    <footer className="hub-footer mt-auto border-t border-border py-6">
      <div className="section-container flex flex-col items-center justify-between gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
        <span>© {new Date().getFullYear()} VADI Hisab</span>
        <span>Admin &amp; farmer hub</span>
      </div>
    </footer>
  );
}
