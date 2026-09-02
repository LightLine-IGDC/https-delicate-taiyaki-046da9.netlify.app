import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..')

function read(path) {
  return readFileSync(resolve(root, path), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const checks = [
  {
    name: 'admin styles are imported once',
    run() {
      const main = read('admin-app/src/main.ts')
      assert(main.includes("import './styles/admin.css'"), 'admin.css is not imported by main.ts')
    },
  },
  {
    name: 'admin shell keeps module and library navigation',
    run() {
      const layout = read('admin-app/src/components/AppLayout.vue')
      assert(layout.includes('光线控制台'), 'admin shell brand is missing')
      assert(layout.includes('v-for="(m, i) in MODULES"'), 'module navigation is not schema-driven')
      assert(layout.includes('to="/articles"'), 'articles navigation is missing')
      assert(layout.includes('to="/media"'), 'media navigation is missing')
    },
  },
  {
    name: 'module editor exposes queue, editor, preview, and save',
    run() {
      const moduleView = read('admin-app/src/views/ModuleView.vue')
      assert(moduleView.includes('collection-workspace'), 'collection workspace layout is missing')
      assert(moduleView.includes('item-queue'), 'editable item queue is missing')
      assert(moduleView.includes('preview-panel'), 'live preview panel is missing')
      assert(moduleView.includes('@click="save"'), 'save action is missing')
      assert(moduleView.includes('function reload()'), 'reload action is missing')
    },
  },
  {
    name: 'field inputs update links through emitted values',
    run() {
      const fieldInput = read('admin-app/src/components/FieldInput.vue')
      assert(fieldInput.includes('function updateLink'), 'link update helper is missing')
      assert(fieldInput.includes("set([...links.value"), 'addLink does not emit a copied array')
      assert(fieldInput.includes('links.value.filter'), 'removeLink does not emit a filtered array')
    },
  },
  {
    name: 'public website source remains outside the admin redesign',
    run() {
      const index = read('public/index.html')
      assert(index.includes('哈尔滨理工大学光线独立游戏制作社团 · LIGHT RAY'), 'public homepage title changed unexpectedly')
      assert(index.includes('js/main.js'), 'public homepage script wiring changed unexpectedly')
    },
  },
  {
    name: 'public timeline uses horizontal spectrum scrubber',
    run() {
      const main = read('public/js/main.js')
      const css = read('public/css/style.css')
      assert(main.includes('initTimelineScrubber()'), 'timeline scrubber initializer is missing')
      assert(main.includes('timeline__axis-wrap'), 'timeline spectrum axis markup is missing')
      assert(main.includes('timeline__axis-track'), 'scrolling timeline axis track is missing')
      assert(main.includes('nodeStep'), 'timeline node spacing is not driven by a fixed scroll step')
      assert(main.includes('axisTrack.style.transform'), 'timeline axis track is not translated with the active node')
      assert(main.includes('axis.addEventListener("wheel"'), 'timeline wheel interaction is missing')
      assert(main.includes('ray.classList.add("is-shooting")'), 'timeline ray animation trigger is missing')
      assert(!main.includes('HOVER SPECTRUM + WHEEL TO SCRUB'), 'timeline wheel hint should be removed')
      assert(main.includes('axisInset'), 'timeline axis endpoints need inset spacing to avoid clipping')
      assert(main.includes('axisRail.clientWidth - axisTrack.offsetWidth'), 'timeline axis end clamp should keep the track background aligned')
      assert(css.includes('.timeline__track'), 'horizontal timeline track styles are missing')
      assert(css.includes('height: 190px'), 'timeline cards do not have a fixed height')
      assert(css.includes('.timeline__axis-track'), 'scrolling timeline axis track styles are missing')
      assert(css.includes('left: 0'), 'timeline axis track should cover the full rail background')
      assert(css.includes('min-width: 100%'), 'timeline axis track should not expose rail background at the endpoints')
      assert(css.includes('overflow: hidden'), 'timeline axis does not clip the scrolling spectrum track')
      assert(css.includes('.timeline__ray.is-shooting'), 'timeline ray shooting animation styles are missing')
    },
  },
  {
    name: 'cloudflare pages config avoids unsupported build fields',
    run() {
      const wrangler = read('wrangler.toml')
      assert(wrangler.includes('pages_build_output_dir = "public"'), 'Cloudflare Pages output directory should be public')
      assert(!/^\[build\]/m.test(wrangler), 'Cloudflare Pages wrangler config must not include unsupported [build]')
      assert(!/^\[build\.environment\]/m.test(wrangler), 'Cloudflare Pages environment variables belong in the dashboard, not [build.environment]')
    },
  },
]

for (const check of checks) {
  check.run()
  console.log(`ok - ${check.name}`)
}
