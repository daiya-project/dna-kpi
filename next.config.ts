import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // 개발 모드에서 React 소스 정보(data-source 등)가 제거되지 않도록 함.
    // LocatorJS 등 "소스로 이동" 도구가 컴포넌트 위치를 찾을 수 있게 도와줌.
    reactRemoveProperties: process.env.NODE_ENV === "production",
    // 이 프로젝트는 Tailwind + Shadcn 사용. styled-components 미사용 시 불필요.
    // styledComponents: true,
  },
};

export default nextConfig;
