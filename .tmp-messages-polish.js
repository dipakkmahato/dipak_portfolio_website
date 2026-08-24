const fs = require('fs');
const path = 'C:/Desktop/video-to-plan-wiz-main/src/routes/messages.tsx';
let text = fs.readFileSync(path, 'utf8');
const oldBlock = `          <section className={\`rounded-xl border border-border/60 bg-card ${showDiagnostics ? "p-6" : "p-4"}\`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Backend Diagnostics</h2>
                <p className="text-sm text-muted-foreground">Live reachability checks for the API, MongoDB, and editor sync.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Refreshes automatically</span>
                <button
                  type="button"
                  onClick={() => setShowDiagnostics((prev) => !prev)}
                  className="rounded-full border border-border/60 px-3 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-[var(--link)] hover:text-[var(--link)]"
                >
                  {showDiagnostics ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">`;
const newBlock = `          <section className={\`rounded-xl border border-border/60 bg-card ${showDiagnostics ? "p-6" : "p-3"}\`}>
            <div className={showDiagnostics ? "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" : "flex flex-wrap items-center gap-2"}>
              <div className={showDiagnostics ? undefined : "flex items-center gap-2"}>
                <h2 className="font-display text-xl font-bold sm:text-2xl">Backend Diagnostics</h2>
                {!showDiagnostics && <span className="text-[11px] text-muted-foreground">Live API, Mongo, and editor health</span>}
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnostics((prev) => !prev)}
                className="rounded-full border border-border/60 px-3 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-[var(--link)] hover:text-[var(--link)]"
              >
                {showDiagnostics ? "Hide" : "Show"}
              </button>
            </div>
            {!showDiagnostics ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", loadingApiHealth ? "border-amber-500/30 bg-amber-500/10 text-amber-700" : apiHealth?.reachable ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : "border-red-500/30 bg-red-500/10 text-red-700"].join(" ")}>{loadingApiHealth ? "API Checking" : apiHealth?.reachable ? "API Online" : "API Offline"}</span>
                <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", loadingMongoHealth ? "border-amber-500/30 bg-amber-500/10 text-amber-700" : mongoHealth?.connected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : "border-red-500/30 bg-red-500/10 text-red-700"].join(" ")}>{loadingMongoHealth ? "Mongo Checking" : mongoHealth?.connected ? "Mongo Online" : "Mongo Offline"}</span>
                <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", loadingSite || loadingBlogs ? "border-amber-500/30 bg-amber-500/10 text-amber-700" : siteError || blogError ? "border-red-500/30 bg-red-500/10 text-red-700" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"].join(" ")}>{loadingSite || loadingBlogs ? "Editors Loading" : siteError || blogError ? "Editors Need Attention" : "Editors Ready"}</span>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">`;
if (!text.includes(oldBlock)) throw new Error('old block not found');
text = text.replace(oldBlock, newBlock);
fs.writeFileSync(path, text, 'utf8');