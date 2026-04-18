"""
MoneyPrinterTurbo 自动化填表脚本
运行前安装依赖：pip install playwright && playwright install chromium
运行方式：python3 automate_ui.py
"""
import asyncio
import os
import time
from datetime import datetime
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout


SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "storage", "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def screenshot_path(name: str) -> str:
    ts = datetime.now().strftime("%H%M%S")
    return os.path.join(SCREENSHOT_DIR, f"{ts}_{name}.png")


async def select_option(page, label_text: str, option_text: str):
    """点击 Streamlit selectbox 并选择指定选项"""
    # 找到包含该 label 的 selectbox 容器
    selectors = page.locator(
        f'[data-testid="stSelectbox"]:has([data-testid="stWidgetLabel"] *:text("{label_text}"))'
    )
    count = await selectors.count()
    if count == 0:
        # fallback: 用 label 文字模糊匹配
        selectors = page.locator('[data-testid="stSelectbox"]').filter(
            has_text=label_text
        )

    box = selectors.first
    await box.scroll_into_view_if_needed()
    await box.locator('[data-baseweb="select"]').click()
    await page.wait_for_timeout(500)

    # 从全局 listbox 中选选项
    option = page.locator('[data-baseweb="popover"] [role="option"]').filter(
        has_text=option_text
    ).first
    await option.wait_for(state="visible", timeout=5000)
    await option.click()
    await page.wait_for_timeout(400)


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False, slow_mo=200)
        ctx = await browser.new_context(viewport={"width": 1400, "height": 900})
        page = await ctx.new_page()

        print("📂 打开 MoneyPrinterTurbo ...")
        await page.goto("http://localhost:8501", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        # ── 1. 切换界面语言为简体中文 ──────────────────────────────────────
        print("🌐 设置界面语言为简体中文 ...")
        lang_box = page.locator('[data-testid="stSelectbox"]').first
        await lang_box.locator('[data-baseweb="select"]').click()
        await page.wait_for_timeout(500)
        zh_option = page.locator('[data-baseweb="popover"] [role="option"]').filter(
            has_text="zh - "
        ).first
        await zh_option.click()
        await page.wait_for_timeout(1500)  # 等待页面重新渲染

        # ── 2. 填写视频主题 ─────────────────────────────────────────────────
        print("✏️  填写视频主题 ...")
        subject_input = page.locator('[data-testid="stTextInput"] input').first
        await subject_input.scroll_into_view_if_needed()
        await subject_input.click()
        await subject_input.fill("宠物猫咪日常，治愈系短视频")
        await page.wait_for_timeout(500)

        # ── 3. 视频来源 → Pexels ────────────────────────────────────────────
        print("🎬 设置视频来源为 Pexels ...")
        await select_option(page, "视频来源", "Pexels")

        # ── 4. 视频比例 → 竖屏 9:16 ─────────────────────────────────────────
        print("📐 设置视频比例为竖屏 9:16 ...")
        await select_option(page, "视频比例", "竖屏 9:16")

        # ── 5. 视频片段最大时长 → 5 秒 ───────────────────────────────────────
        print("⏱️  设置片段时长为 5 秒 ...")
        await select_option(page, "视频片段最大时长", "5")

        # ── 6. TTS 服务器 → Azure TTS V1（即 edge，免费）─────────────────────
        print("🔊 设置 TTS 服务器为 Azure TTS V1（edge 免费）...")
        await select_option(page, "TTS服务器", "Azure TTS V1")
        await page.wait_for_timeout(800)

        # ── 7. 朗读声音 → 中文女声（晓晓 / zh-CN-XiaoxiaoNeural）─────────────
        print("🎤 选择中文女声（晓晓）...")
        voice_box = page.locator('[data-testid="stSelectbox"]').filter(
            has_text="朗读声音"
        ).first
        await voice_box.locator('[data-baseweb="select"]').click()
        await page.wait_for_timeout(500)
        # 优先选晓晓；若不存在则选第一个 zh-CN 女声
        female_voices = page.locator('[data-baseweb="popover"] [role="option"]')
        count = await female_voices.count()
        clicked = False
        for i in range(count):
            text = await female_voices.nth(i).inner_text()
            if "晓晓" in text or "Xiaoxiao" in text:
                await female_voices.nth(i).click()
                clicked = True
                break
        if not clicked and count > 0:
            await female_voices.first.click()
        await page.wait_for_timeout(500)

        # ── 8. 字幕位置 → 底部 ───────────────────────────────────────────────
        print("📝 设置字幕位置为底部 ...")
        await select_option(page, "字幕位置", "底部")

        # ── 9. 截图：填表完成 ─────────────────────────────────────────────────
        p1 = screenshot_path("01_form_filled")
        await page.screenshot(path=p1, full_page=True)
        print(f"📸 截图已保存：{p1}")

        # ── 10. 点击「AI生成文案和关键词」────────────────────────────────────
        print("🤖 点击 AI 生成视频文案和关键词 ...")
        gen_script_btn = page.get_by_role("button").filter(
            has_text="生成"
        )
        # 找到包含「主题」字样的生成按钮（区别于「生成视频」按钮）
        script_buttons = page.locator('button[kind="secondary"], button[kind="primary"]')
        btn_count = await script_buttons.count()
        target_btn = None
        for i in range(btn_count):
            btn_text = await script_buttons.nth(i).inner_text()
            if "主题" in btn_text and "生成" in btn_text:
                target_btn = script_buttons.nth(i)
                break
        if target_btn is None:
            # fallback：找第一个包含「生成」且不含「视频」的按钮
            for i in range(btn_count):
                btn_text = await script_buttons.nth(i).inner_text()
                if "生成" in btn_text and "视频" not in btn_text:
                    target_btn = script_buttons.nth(i)
                    break
        if target_btn:
            await target_btn.scroll_into_view_if_needed()
            await target_btn.click()
        else:
            print("⚠️  未找到文案生成按钮，尝试通过文字内容查找 ...")
            await page.get_by_text("生成 【视频文案】").click()

        # ── 11. 等待生成完成（spinner 消失）─────────────────────────────────
        print("⏳ 等待 AI 生成文案（最多 120 秒）...")
        try:
            await page.locator('[data-testid="stSpinner"]').wait_for(
                state="visible", timeout=10000
            )
            await page.locator('[data-testid="stSpinner"]').wait_for(
                state="hidden", timeout=120000
            )
        except PlaywrightTimeout:
            print("ℹ️  spinner 超时，继续执行 ...")
        await page.wait_for_timeout(2000)

        # ── 12. 截图：文案生成后 ──────────────────────────────────────────────
        p2 = screenshot_path("02_script_generated")
        await page.screenshot(path=p2, full_page=True)
        print(f"📸 截图已保存：{p2}")
        print(f"\n👀 请查看截图确认文案内容：\n   {p2}\n")

        # ── 13. 点击「生成视频」──────────────────────────────────────────────
        print("🎬 点击生成视频 ...")
        await page.scroll_to_bottom() if hasattr(page, "scroll_to_bottom") else None
        gen_video_btn = page.get_by_role("button").filter(has_text="生成视频").last
        await gen_video_btn.scroll_into_view_if_needed()
        await gen_video_btn.click()

        # ── 14. 等待视频生成完成 ──────────────────────────────────────────────
        print("⏳ 等待视频生成（最多 10 分钟）...")
        try:
            await page.locator('[data-testid="stSpinner"]').wait_for(
                state="visible", timeout=15000
            )
            await page.locator('[data-testid="stSpinner"]').wait_for(
                state="hidden", timeout=600000
            )
        except PlaywrightTimeout:
            print("ℹ️  视频生成 spinner 超时，继续 ...")
        await page.wait_for_timeout(3000)

        # ── 15. 截图：最终状态 ────────────────────────────────────────────────
        p3 = screenshot_path("03_video_done")
        await page.screenshot(path=p3, full_page=True)
        print(f"📸 最终截图已保存：{p3}")

        # ── 16. 查找视频文件路径 ──────────────────────────────────────────────
        storage_dir = os.path.join(os.path.dirname(__file__), "storage", "tasks")
        video_path = None
        if os.path.exists(storage_dir):
            for task_id in sorted(os.listdir(storage_dir), reverse=True):
                task_dir = os.path.join(storage_dir, task_id)
                for f in os.listdir(task_dir):
                    if f.startswith("final") and f.endswith(".mp4"):
                        video_path = os.path.join(task_dir, f)
                        break
                if video_path:
                    break

        if video_path:
            print(f"\n✅ 视频已生成：\n   {video_path}\n")
            os.system(f'open "{video_path}"')  # Mac 自动打开视频
        else:
            print(f"\n⚠️  未找到视频文件，请检查 storage/tasks 目录")
            print(f"   截图路径：{p3}")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
