---
description: dna-kpi 프로젝트의 메인 규칙 및 기본 규칙
alwaysApply: true
---

# 프로젝트 메인 규칙

## 규칙 언어

**이 프로젝트의 모든 규칙은 영어로 작성한다.**  
`.cursor/rules/` 아래 파일을 추가·수정할 때는 규칙 본문을 영어로 작성하여, AI 가이드와 프로젝트 규칙이 일관되고 언어에 구애받지 않도록 한다.

## 범위

이 파일은 프로젝트의 핵심·기준 기대 사항을 정의한다. 다른 규칙 파일이 그 위에 파일별·주제별 규칙을 더할 수 있다.

## 기술 스택 맥락

- **프레임워크:** Next.js 16 (App Router, React 19).
- **백엔드 / 데이터:** Supabase (`@supabase/supabase-js` + `@supabase/ssr`).
- **스타일링:** Tailwind CSS v4.
- **UI 컴포넌트:** Shadcn/ui (Radix UI 기반 + Tailwind; `npx shadcn@latest add <component>`로 설치; 외부에서 복사·붙여넣지 말고 프로젝트의 기존 `components.json`과 `components/ui/`를 사용한다).
- **상태 관리:** Zustand. 스토어는 `stores/` 디렉토리에 파일 하나당 하나의 스토어로 관리한다. 개발 시 `devtools` 미들웨어를 사용한다. Redux, MobX, Jotai 등 다른 상태 관리 라이브러리를 사용하지 **않는다**.
- **생성되는 모든 코드는 위 기술만 사용한다.** Next.js 패턴(Server Components, Server Actions 등)과 프로젝트의 Shadcn/ui 컴포넌트를 우선하고, 다른 UI 라이브러리나 프레임워크를 도입하지 않는다.

## 프로젝트 구조

```
app/                  # Next.js App Router (레이아웃, 페이지, 라우트 핸들러)
  globals.css         # 전역 스타일 (Tailwind 디렉티브, CSS 변수)
components/
  ui/                 # Shadcn/ui 컴포넌트 (npx shadcn@latest add로 추가)
  common/             # 공용 재사용 UI 컴포넌트
hooks/                # 커스텀 React 훅
stores/               # Zustand 스토어 (파일당 하나의 스토어)
lib/
  api/                # API / 데이터 통신 레이어 전용
  supabase/           # Supabase 클라이언트 (client.ts, server.ts, middleware.ts)
  utils/              # 공용 유틸리티 (index.ts로 배럴 익스포트)
  utils.ts            # Shadcn 호환용 레거시 re-export
types/                # 전역 타입 정의
  database.types.ts   # Supabase 자동 생성 (npm run update-types)
  app-db.types.ts     # 앱에서 사용하는 테이블/뷰 re-export
public/               # 정적 자산
middleware.ts         # Next.js 미들웨어 (Supabase 세션 갱신)
```

## 새 컴포넌트 생성 시

**필수:** 새 컴포넌트가 필요할 때는 **즉시 만들지 않는다.** 사용자 확인 없이 컴포넌트를 생성하는 것은 **허용되지 않는다.**

1. **먼저 제안한다.** 컴포넌트 파일을 작성하기 전에 반드시 사용자에게 다음을 포함한 제안을 제시한다.
   - **폴더 및 경로:** 컴포넌트를 둘 위치 (예: `components/common/`, `app/(dashboard)/dashboard/_components/`). 기존 구조와 명명 규칙에 맞게 제안한다.
   - **Server vs Client:** 해당 컴포넌트를 **Server Component**(기본; `"use client"` 없음)로 할지 **Client Component**(훅·이벤트 핸들러·브라우저 API 사용으로 `"use client"` 필요)로 할지, 그리고 그 이유를 간단히 밝힌다.
   - **기존 라이브러리 활용:** **Shadcn/ui** 등 프로젝트에서 허용한 라이브러리를 어떻게 쓸 수 있는지 (예: “Shadcn `Tabs` 사용”, “`components/ui/`의 기존 `Button` 사용”). 새로운 패턴 도입보다 기존 UI 재사용을 우선한다.
2. **확인을 받을 때까지 대기한다.** 제안한 경로, Server/Client 선택, 라이브러리 사용에 대해 사용자 확인을 요청한다.
3. **확인 후에만 생성한다.** 사용자가 제안(또는 수정된 제안)을 **명시적으로 확인한 뒤에만** 컴포넌트를 생성한다.

## Workflow and Roadmap

- **작업을 시작하기 전에 항상 `@.cursor/rules/02-project-roadmap.mdc`를 확인**하여 현재 단계와 컨텍스트를 파악한다.
- **로드맵 갱신**: 작업이 완료되면 `02-project-roadmap.mdc`에서 해당 항목을 체크(`[x]`)하고, 목록에서 다음 단계를 제안한다.

## 소통 및 문서 언어

- **사용자에게 하는 피드백**: 사용자에게 전달하는 피드백, 설명, 응답은 **한국어**를 사용한다.
- **마크다운 문서**: 프로젝트 내 마크다운(`.md`) 문서를 만들거나 수정할 때 — `.cursor/rules/` 아래 규칙 파일은 제외 — 문서 내용은 **한국어**로 작성한다.
