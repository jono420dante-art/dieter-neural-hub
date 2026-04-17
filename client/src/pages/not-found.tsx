import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-6xl font-mono font-bold mb-4" style={{ color: "rgba(61, 242, 224, 0.15)" }}>
          404
        </div>
        <h1 className="text-sm font-mono font-bold tracking-wider mb-2" style={{ color: "#3DF2E0" }}>
          SECTOR NOT FOUND
        </h1>
        <p className="text-xs font-mono mb-6" style={{ color: "#3D5253" }}>
          The requested neural pathway does not exist in DIETER's network.
        </p>
        <Link href="/">
          <span
            className="inline-block px-4 py-2 rounded-md font-mono text-xs font-bold tracking-wider uppercase cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(61, 242, 224, 0.1), rgba(76, 201, 240, 0.1))",
              border: "1px solid rgba(61, 242, 224, 0.2)",
              color: "#3DF2E0",
            }}
          >
            Return to Command Center
          </span>
        </Link>
      </div>
    </div>
  );
}
