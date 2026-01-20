// components/StatusBadges.tsx
import Image from "next/image";

export function StatusBadges() {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1">
        <span>Build</span>
        <Image
          src="https://github.com/fetsare/manbacken-depart/actions/workflows/ci.yml/badge.svg?event=push"
          alt="Build status"
          width={90}
          height={20}
        />
      </div>
    </div>
  );
}
