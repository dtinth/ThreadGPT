import { test, expect, Page } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/ThreadGPT/)
})

test('can chat with AI chatbot', async ({ page }) => {
  await page.goto('/')
  page.once('dialog', (dialog) => {
    dialog.accept('cat')
  })

  const app = new ThreadGPTPage(page)
  const thread1 = await app.startThread('hello, world!')
  await app.assertConversation(['> hello, world!'])

  await thread1.generateReply()
  await app.assertConversation(['> hello, world!', '>> meow, meow!'])

  const thread2 = await app.threadWithText('meow, meow!').reply('how are you?')
  await thread2.generateReply()

  await app.assertConversation([
    '> hello, world!',
    '>> meow, meow!',
    '>>> how are you?',
    '>>>> meow meow meow?',
  ])
})

test('can tweak message', async ({ page }) => {
  await page.goto('/')
  const app = new ThreadGPTPage(page)
  const thread1 = await app.startThread('hello, world!')
  await thread1.tweakMessage('hey there!')
  await app.assertConversation(['> hey there!', '> hello, world!'])
})

test('custom reply', async ({ page }) => {
  await page.goto('/')
  const app = new ThreadGPTPage(page)
  const thread1 = await app.startThread('hello, world!')
  await thread1.customReply('hey there!')
  await app.assertConversation(['> hello, world!', '>> hey there!'])
})

test('remove message', async ({ page }) => {
  await page.goto('/')
  const app = new ThreadGPTPage(page)
  await app.startThread('hello, world!').then(async (t) => {
    await t.customReply('Message 1').then(async (t) => {
      await t.reply('M 1.1')
      await t.reply('M 1.2')
    })
    await t.customReply('Message 2').then(async (t) => {
      await t.reply('M 2.1')
      await t.reply('M 2.2')
    })
  })
  await app.assertConversation([
    '> hello, world!',
    '>> Message 2',
    '>>> M 2.2',
    '>>> M 2.1',
    '>> Message 1',
    '>>> M 1.2',
    '>>> M 1.1',
  ])
  await app.threadWithText('Message 1').remove()
  await app.assertConversation([
    '> hello, world!',
    '>> Message 2',
    '>>> M 2.2',
    '>>> M 2.1',
  ])
  await app.threadWithText('M 2.1').remove()
  await app.assertConversation(['> hello, world!', '>> Message 2', '>>> M 2.2'])
})

class ThreadGPTPage {
  constructor(private page: Page) {}
  async startThread(text: string) {
    await this.page.getByRole('textbox').fill(text)
    await this.page.getByRole('button', { name: 'Start a thread' }).click()
    return this.threadWithText(text)
  }
  threadWithText(text: string) {
    return new Thread(this.page, text)
  }
  async assertConversation(messages: string[]) {
    await expect
      .poll(() =>
        this.page
          .locator('[data-content]')
          .evaluateAll((nodes) =>
            nodes.map(
              (node) =>
                '>'.repeat(+node.dataset.depth!) + ' ' + node.dataset.content,
            ),
          ),
      )
      .toEqual(messages)
  }
}

class Thread {
  locator: any
  textbox: any
  constructor(private page: Page, private text: string) {
    this.locator = this.page.locator(`[data-content="${this.text}"]`)
    this.textbox = this.locator.getByRole('textbox')
  }
  async reply(text: string) {
    const textbox = this.textbox
    const replyButton = this.locator.getByRole('button', {
      name: 'Reply',
      exact: true,
    })
    await expect
      .poll(async () => {
        if (!(await textbox.isVisible())) {
          if (await replyButton.isVisible()) {
            await replyButton.click()
          }
        }
        return textbox.isVisible()
      })
      .toBe(true)
    await textbox.fill(text)
    await replyButton.click()
    return new Thread(this.page, text)
  }
  async generateReply() {
    await this.locator.getByRole('button', { name: 'Generate a reply' }).click()
  }
  async remove() {
    await this.selectMenuOption('Remove')
  }
  async tweakMessage(text: string) {
    await this.selectMenuOption('Tweak message')

    // When tweaking a message, the textbox does not belong to the thread,
    // so we query for any textbox (assuming that no other textbox is visible).
    const textbox = this.page.getByRole('textbox')

    // When tweaking a message, the textbox is pre-filled with the message.
    await expect(textbox).toHaveValue(this.text)

    await textbox.fill(text)
    await this.page.getByRole('button', { name: 'Tweak' }).click()
  }
  async customReply(text: string) {
    await this.selectMenuOption('Custom reply')
    await this.textbox.fill(text)
    await this.locator.getByRole('button', { name: 'Reply' }).click()
    return new Thread(this.page, text)
  }
  private async selectMenuOption(name: string) {
    await this.locator.getByRole('button', { name: 'More options' }).click()
    await this.page.getByRole('menuitem', { name, exact: true }).click()
  }
}
