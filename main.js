// 移动端导航切换
const toggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('navMobile');

if (toggle && mobileNav) {
  toggle.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });

  // 点击链接后关闭菜单
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
    });
  });
}
