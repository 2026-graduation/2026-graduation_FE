import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

// 환경 변수 ANALYZE가 'true'일 때만 플러그인 활성화
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true, // 빌드 완료 시 자동으로 브라우저 탭 열기
});

// 백엔드(로컬 파일 저장소) 주소에서 내려오는 이미지를 허용한다.
const localImagePatterns = (() => {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080");
    return [{
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/api/files/local/**",
    }];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_PORTONE_STORE_ID: process.env.VITE_PORTONE_STORE_ID,
    NEXT_PUBLIC_PORTONE_CHANNEL_KEY: process.env.VITE_PORTONE_CHANNEL_KEY,
  },
    experimental: {
    serverActions: {
      bodySizeLimit: "210mb",
    },
  },
images: {
  // 로컬 저장소(백엔드 storage.type=local) 사용 시 next/image 가 localhost 이미지를 가져올 수 있도록 허용
  dangerouslyAllowLocalIP: true,
  remotePatterns: [
    {
      protocol: "https",
      hostname: "gymjjak-prod.s3.ap-northeast-2.amazonaws.com",
      pathname: "/uploads/**",
    },
    ...localImagePatterns,
  ],
},
  // 로컬 실행용: 프론트가 `${origin}/ws`로 접속하는 WebSocket(SockJS) 요청을 백엔드로 전달한다.
  // 배포 환경에서는 리버스 프록시(Caddy)가 /ws를 처리하므로, LOCAL_WS_PROXY=true 일 때만 활성화한다.
  async rewrites() {
    if (process.env.LOCAL_WS_PROXY !== 'true') return [];
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
    if (!apiBase) return [];
    return [{ source: '/ws/:path*', destination: `${apiBase}/ws/:path*` }];
  },
  /* config options here */
  output: 'standalone'
};
export default withBundleAnalyzer(nextConfig);
