/*==========================
Handle scroll functions
===========================*/

const MyStickyHeader = false,
	header = document.querySelector("header"),
	doc = document.querySelector(":root"),
	scrollToTopBtn = document.querySelector(".scrollToTop"),
	headerHeight = header.offsetHeight;

let lastScrollTop = 0;

function debounce(func, wait = 10, immediate = true) {
	var timeout;
	return function () {
		var context = this,
			args = arguments;
		var later = function () {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

function handleScroll() {
	scrollTop = window.pageYOffset;

	if (MyStickyHeader) {
		if (scrollTop > 0) {
			header.classList.add("scroll");
		} else {
			header.classList.remove("scroll");
		}

		if (scrollTop > 300) {
			header.classList.add("check");
		} else {
			header.classList.remove("check");
		}

		if (scrollTop > 300 && scrollTop > lastScrollTop) {
			header.classList.add("exit");
		} else {
			header.classList.remove("exit");
		}
	}

	if (scrollTop > 300) {
		scrollToTopBtn.classList.add("show");
	} else {
		scrollToTopBtn.classList.remove("show");
	}

	lastScrollTop = scrollTop;
}

if (MyStickyHeader) {
	doc.style.setProperty("--headerH", headerHeight + "px");
	header.style.setProperty("position", "fixed");
}

window.addEventListener("scroll", debounce(handleScroll));
