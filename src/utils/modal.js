function modalTrigger(key) {
	const modal = document.getElementById(`modal_${key}`);
	modal.showModal();
	modal.scrollTo(0, 0);
}
function modalBtnClose(key) {
	const modal = document.getElementById(`modal_${key}`);
	modal.close();
}
function modalBackdropClose(event, key) {
	const modal = document.getElementById(`modal_${key}`);
	var rect = modal.getBoundingClientRect();
	var isInDialog =
		rect.top <= event.clientY &&
		event.clientY <= rect.top + rect.height &&
		rect.left <= event.clientX &&
		event.clientX <= rect.left + rect.width;
	if (!isInDialog) {
		modal.close();
	}
}

export { modalTrigger, modalBtnClose, modalBackdropClose };
