# Nexia Developer Protocol

외부 개발 도구가 공유하는 실험적 원격 UI 선언 규약입니다. Node.js 22 이상에서 빌드 없이 ESM으로 사용합니다. 현재 버전은 실험적 alpha이며 npm의 `alpha` 태그로 배포합니다.

이 규약은 기존 PHP App의 Composer 패키지 Manifest를 대체하지 않습니다. 원격 UI 실행, Resource API, Functions, Sandbox, 배포 권한을 구현하거나 부여하지 않습니다. `permissions.required`는 요구사항의 선언일 뿐이며 실제 승인과 권한 검사는 Core의 책임입니다.

```js
import { validateManifest, PROTOCOL_VERSION, DISCOVERY_PATH } from '@amuzcorp/nexia-dev-protocol';

const result = validateManifest({
  schema_version: '1',
  app: { id: 'com.example.notes', name: 'Notes', version: '0.1.0' },
  screens: [{ id: 'notes', route: '/notes', entry: 'src/notes.tsx' }],
  permissions: { required: ['notes.read'] },
});
// { valid: true, errors: [] }
```

`validateManifest(unknown)`은 입력을 변경하지 않고 `{ valid, errors: [{ path, message }] }`를 반환합니다. 잘못된 선언은 경로별 오류로 보고합니다. 알 수 없는 필드와 Functions 같은 미지원 기능은 거절합니다. 앱 ID는 소문자 역도메인 형식, 버전은 SemVer, 화면 ID는 소문자 하이픈 형식입니다. 화면은 최소 하나여야 하며 ID와 route는 각각 고유해야 합니다. 경로는 `/` 또는 `/notes/list` 같은 정적 경로이며 쿼리·해시·동적 파라미터·끝 슬래시는 지원하지 않습니다. entry는 `src/notes.tsx` 같은 상대 파일 경로이며 상위 이동·절대 경로·역슬래시는 거절합니다. 실제 파일 존재와 symlink 경계는 파일을 읽는 도구가 별도로 확인해야 합니다.

에디터용 JSON Schema는 `@amuzcorp/nexia-dev-protocol/manifest.schema.json`에서 제공합니다. JSON Schema 단독으로는 화면별 ID·route 중복을 검사할 수 없으므로 최종 선언 검사는 `validateManifest`를 사용합니다. JSON/YAML 문서 파싱은 이 패키지의 범위 밖입니다.

## Discovery 계약

Core의 `/.well-known/nexia-developer-platform` 공개 응답은 다음 형태입니다. 기능 값이 `false`이면 클라이언트는 해당 기능이 작동한다고 표시하거나 호출해서는 안 됩니다.

```json
{
  "protocol_version": "1",
  "status": "experimental",
  "capabilities": {
    "manifest_validation": false,
    "project_management": false,
    "remote_development": false,
    "deployments": false,
    "functions": false
  },
  "authentication": { "methods": [] }
}
```

타입 `DeveloperManifest`, `ValidationResult`, `DeveloperDiscovery`를 제공합니다. Discovery의 manifest_validation은 서버의 검증 기능을 뜻하며 이 패키지의 로컬 검증기와 별개입니다. Discovery에는 비밀이나 사용자·테넌트 데이터를 넣지 않습니다.

## 로컬 연결과 검증

`npm test`로 선언 검사를 확인하고 `npm pack`으로 로컬 tarball을 만들 수 있습니다. 다른 저장소에서는 이 tarball을 `npm install --workspaces=false --no-save --package-lock=false /absolute/path/to/tarball.tgz`로 연결합니다. 의존 선언은 정상 버전 문자열을 유지합니다. 메타데이터의 `UNLICENSED`는 별도 오픈소스 사용권을 부여하지 않음을 뜻합니다. 공개 registry 게시와 사용권 부여는 별개입니다.
