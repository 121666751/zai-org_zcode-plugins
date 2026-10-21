import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { buildAll, ROOT } from '../scripts/lib/build.mjs'

test('repeated builds have identical distributable bytes and stable metadata', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'context-insight-build-'))
  const previous = process.env.ZCODE_PLUGIN_INSTALL_DIR
  process.env.ZCODE_PLUGIN_INSTALL_DIR = resolve(ROOT, '../../external_plugins/zcode-context-insight')
  try {
    const first = join(temporary, 'first')
    const second = join(temporary, 'second')
    const manifest = await buildAll({ quiet: true, dist: first })
    await buildAll({ quiet: true, dist: second })
    const files = (await readdir(first)).sort()
    assert.deepEqual(files, (await readdir(second)).sort())
    assert.ok(files.includes('build.json'))
    for (const file of files) {
      assert.deepEqual(await readFile(join(first, file)), await readFile(join(second, file)), `${file} changed between builds`)
    }
    assert.deepEqual(JSON.parse(await readFile(join(first, 'build.json'), 'utf8')), {
      name: manifest.name, version: manifest.version,
    })
  } finally {
    if (previous === undefined) delete process.env.ZCODE_PLUGIN_INSTALL_DIR
    else process.env.ZCODE_PLUGIN_INSTALL_DIR = previous
    await rm(temporary, { recursive: true, force: true })
  }
})
