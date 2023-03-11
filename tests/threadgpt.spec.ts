import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/ThreadGPT/)
})

test('can chat with AI chatbot', async ({ page }) => {
  await page.goto('/')
  page.once('dialog', (dialog) => {
    dialog.accept('cat')
  })

  await page.getByRole('textbox').fill('hello, world!')
  await page.getByRole('button', { name: 'Start a thread' }).click()
  await expect(page.locator('[data-content="hello, world!"]')).toBeVisible()
  await page.getByRole('button', { name: 'Generate a reply' }).click()
  await expect(page.locator('[data-content="meow, meow!"]')).toBeVisible()
  await page.getByRole('textbox').fill('how are you?')
  await page.getByRole('button', { name: 'Reply', exact: true }).click()
  await page.getByRole('button', { name: 'Generate a reply' }).click()
  await expect(page.locator('[data-content="meow meow meow?"]')).toBeVisible()
})

test('can tweak message', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').fill('hello, world!')
  await page.getByRole('button', { name: 'Start a thread' }).click()
  page
    .locator('[data-content="hello, world!"]')
    .getByRole('button', { name: 'More options' })
    .click()
  page.getByRole('menuitem', { name: 'Tweak message' }).click()
  await expect(page.getByRole('textbox')).toHaveValue('hello, world!')
  await page.getByRole('textbox').fill('hey there!')
  await page.getByRole('button', { name: 'Tweak' }).click()
  await expect(page.locator('[data-content="hello, world!"]')).toBeVisible()
  await expect(page.locator('[data-content="hey there!"]')).toBeVisible()
})
