/*==========================
Sticky Header
===========================*/

const MyStickyHeader = false,
	header = document.querySelector("header"),
	doc = document.querySelector(":root"),
	scrollToTopBtn = document.querySelector(".scrollToTop"),
	headerHeight = header.offsetHeight;

let lastScrollTop = 0;

doc.style.setProperty("--headerH", headerHeight + "px");

if (MyStickyHeader) {
	header.style.setProperty("position", "fixed");
}

if (MyStickyHeader) {
	window.addEventListener("scroll", function () {
		scrollTop = window.pageYOffset;

		if (scrollTop > 0) {
			header.classList.add("scroll");
		} else {
			header.classList.remove("scroll");
		}

		if (scrollTop > 300) {
			header.classList.add("check");
			scrollToTopBtn.classList.add("show");
		} else {
			header.classList.remove("check");
			scrollToTopBtn.classList.remove("show");
		}

		if (scrollTop > 300 && scrollTop > lastScrollTop) {
			header.classList.add("exit");
		} else {
			header.classList.remove("exit");
		}

		lastScrollTop = scrollTop;
	});
}
