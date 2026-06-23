import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const outDir = '.tmp/plan-behavior'

rmSync(outDir, { recursive: true, force: true })

execFileSync(
  process.execPath,
  [
    './node_modules/typescript/bin/tsc',
    '--ignoreConfig',
    '--target',
    'ES2022',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--rootDir',
    'src',
    '--outDir',
    outDir,
    '--skipLibCheck',
    'src/constants/regions.ts',
    'src/utils/chatUnread.ts',
  ],
  { stdio: 'inherit' },
)

const regionsModule = await import(pathToFileURL(`${process.cwd()}/${outDir}/constants/regions.js`))
const unreadModule = await import(pathToFileURL(`${process.cwd()}/${outDir}/utils/chatUnread.js`))

const { REGION_FILTERS } = regionsModule
const {
  clampUnreadCount,
  sumUnreadCounts,
  decrementUnreadCount,
  nextUnreadCountForIncomingMessage,
} = unreadModule

assert.deepEqual(
  REGION_FILTERS.map((item) => item.label),
  ['전체', '서울', '수도권', '강원', '충청', '전라', '경상', '부울경', '제주'],
)
assert.equal(REGION_FILTERS[0].regions, undefined)
assert.deepEqual(REGION_FILTERS.find((item) => item.label === '수도권')?.regions, [
  '서울',
  '경기',
  '인천',
])
assert.deepEqual(REGION_FILTERS.find((item) => item.label === '부울경')?.regions, [
  '부산',
  '대구',
  '울산',
])

assert.equal(clampUnreadCount(-1), 0)
assert.equal(sumUnreadCounts([{ unreadCount: 2 }, { unreadCount: undefined }, { unreadCount: 3 }]), 5)
assert.equal(decrementUnreadCount(5, 2), 3)
assert.equal(decrementUnreadCount(1, 5), 0)
assert.equal(nextUnreadCountForIncomingMessage(4, true), 4)
assert.equal(nextUnreadCountForIncomingMessage(4, false), 5)

console.log('plan behavior checks passed')


