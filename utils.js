function throttle(func, wait) {
	let timeout, context, args, result;
	let previous = 0;

	let later = function () {
		previous = Date.now();
		timeout = null;
		result = func.apply(context, args);
		if (!timeout) context = args = null;
	};

	return function () {
		let now = Date.now();
		let remaining = wait - (now - previous);
		context = this;
		args = arguments;
		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		} else if (!timeout) {
			timeout = setTimeout(later, remaining);
		}
		return result;
	};
};

function binarySearch(list, value, start, stop) {
	start = start || 0
	stop = stop || list.length - 1
	let middle = Math.floor((start + stop) / 2)

	while (list[middle] !== value && start < stop) {
		if (value < list[middle]) {
			stop = middle - 1
		} else {
			start = middle + 1
		}
		middle = Math.floor((start + stop) / 2)
	}

	if (value == list[middle]) {
		return middle;
	} else if (value > list[middle]) {
		return value - list[middle] > list[middle + 1] - value ? middle + 1 : middle;
	}
	return list[middle] - value > value - list[middle - 1] ? middle - 1 : middle;
}
const monthNames = [
	'Jan', 'Feb', 'Mar',
	'Apr', 'May', 'Jun', 'Jul',
	'Aug', 'Sep', 'Oct',
	'Nov', 'Dec'
];
function formatDate(m, type) { // 1 - d, 2 - m, 3 - y
	if (type === 1) {
		return monthNames[m.getMonth()] + ' ' + m.getDate();
	} else if (type === 2) {
		return monthNames[m.getMonth()] + ' ' + m.getFullYear();
	} else {
		return m.getFullYear();
	}
}

const formatNumber = (function () {
	let formatter = new Intl.NumberFormat('ru-RU', {
		maximumFractionDigits: 0
	});
	return formatter.format;
})();

const check = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 70 70" style="enable-background:new 0 0 70 70;" xml:space="preserve">' +
	'<path d="M26.474,70c-2.176,0-4.234-1.018-5.557-2.764L3.049,43.639C0.725,40.57,1.33,36.2,4.399,33.875c3.074-2.326,7.441-1.717,9.766,1.35l11.752,15.518L55.474,3.285c2.035-3.265,6.332-4.264,9.604-2.232     c3.268,2.034,4.266,6.334,2.23,9.602l-34.916,56.06c-1.213,1.949-3.307,3.175-5.6,3.279C26.685,69.998,26.58,70,26.474,70z"/>' +
'</svg>';

const ln10 = Math.log(10);
const calcStepSize = (range, targetSteps) => {
	targetSteps = Math.floor(targetSteps);
	let tempStep = range / targetSteps;
	let mag = Math.floor(Math.log(tempStep) / ln10);
	let magPow = Math.pow(10, mag);
	let magMsd = tempStep / magPow + 0.5;

	if (magMsd > 7.5) {
		magMsd = 10.0;
	} else if (magMsd > 5) {
		magMsd = 7.5;
	} else if (magMsd > 3.5) {
		magMsd = 5.0;
	} else if (magMsd > 2.5) {
		magMsd = 2.5;
	} else if (magMsd > 1.0) {
		magMsd = 2.0;
	}

	return magMsd * magPow;
};
