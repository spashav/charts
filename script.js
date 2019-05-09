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

class Chart {
	constructor(data, config = {}) {
		this.defaultColors = ['#3DC23F', '#F34C44'];
		this.defaultName = 'Chart';
		this.config = config;
		this.resolution = config.resolution || window.devicePixelRatio || 1;
		this.thickness = config.thickness || 2;

		this._update = this._update.bind(this);
		this._updateMap = this._updateMap.bind(this);
		this._calcSizes = this._calcSizes.bind(this);
		this._updateVerticals = throttle(this._updateVerticals.bind(this), 16);

		this.setSource(data);
	}

	setSource(data) {
		this.data = data || {}
		this.types = data && data.types || {};
		this.columns = data && data.columns || [];
		this.names = data && data.names || {};
		this.colors = data && data.colors || [];

		this._parse();
	}

	_parse() {
		this.xKey;
		let lineKeysMap = {};

		Object.keys(this.types).forEach(key => {
			const type = this.types[key];
			if (type === 'x') {
				this.xKey = key;
			}
			else if (type === 'line') {
				lineKeysMap[key] = true;
			}
		});

		let colorIndex = 0;
		this.activeLines = {};
		this.lines = this.columns.filter((column, i) => {
			const key = column[0];
			if (!column || !column.length) {
				return false;
			}
			if (lineKeysMap[key]) {
				this.activeLines[key] = true;
				this.colors[key] = this.colors[key] || this.defaultColors[colorIndex++ % this.defaultColors.length];
				this.names[key] = this.names[key] || (this.defaultName + ` ${i + 1}`);
				return true;
			}
			if (column[0] === this.xKey) {
				this.x = column;
			}
		});

		this.xLabels = [];
		this._initXLabels();
	}

	draw(elem) {
		if (!elem) {
			return;
		}
		elem.innerHTML =
			`<div style="flex: 0 0 auto; margin-bottom: 12px; font-weight: 600;">Followers</div>`+
			`<canvas class="grid-canvas"></canvas>`+
			`<canvas class="main-canvas" style="flex: 1 1 auto;"></canvas>`+
			`<div class="overlay-cont">`+
				`<div class="vertical"></div>`+
				`<div class="y-labels"></div>`+
				`<div class="tooltip"></div>`+
				`<div class="overlay"></div>`+
			`</div>`+
			`<div style="flex: 0 0 auto;">`+
				`<div class="x-labels"></div>`+
				`<div class="scale">`+
					`<canvas style="width: 100%;"></canvas>`+
					`<div class="scale-cont">`+
						`<div class="scale-center"></div>`+
						`<div class="scale-left"></div>`+
						`<div class="scale-right"></div>`+
					`</div>`+
				`</div>`+
				`<div class="badges">`+
					this.lines.reduce((mem, y) => {
						return mem + 
							`<div class="badges-item" data-id="${y[0]}">`+
								`<div class="badges-item-icon" style="background-color: ${this.colors[y[0]]}; border: 2px solid ${this.colors[y[0]]};">${check}</div>`+
								`<div class="badges-item-text">${this.names[y[0]]}</div>`+
							`</div>`;
					}, '')+
				`</div>`+
			`</div>`;
		
		this.elem = elem;
		this.canvas = elem.querySelector('.main-canvas');
		this.grid = elem.querySelector('.grid-canvas');
		this.scale = elem.querySelector('.scale');

		this.map = this.scale.querySelector('canvas');
		this.badges = elem.querySelector('.badges');
		this.vDiv = elem.querySelector('.vertical');
		this.tooltip = elem.querySelector('.tooltip');
		this.overlay = elem.querySelector('.overlay');
		this.overlayCont = elem.querySelector('.overlay-cont');
		this.xLabelsElem = elem.querySelector('.x-labels');
		this.yLabelsElem = elem.querySelector('.y-labels');

		this.mContext = this.map.getContext('2d');
		this.context = this.canvas.getContext('2d');
		this.gContext = this.grid.getContext('2d');

		const initialP1 = 1 + this.x.length - Math.min(this.x.length, Math.ceil(this.elem.clientWidth / 25));

		this.current = {
			p1: initialP1,
			p2: this.x.length - 1,
			x1: this.x[initialP1],
			x2: this.x[this.x.length - 1]
		};

		this._calcSizes();
		window.addEventListener('resize', this._calcSizes);

		setTimeout(() => {
			this._initMap();
			this._initBadges();
			this._initVerticals();
			this.showVerticals = true;
		}, 100);
	}

	_calcSizes() {
		this.canvas.height = 'auto';
		this.map.style.height = '40px';
		
		this.width = this.elem.clientWidth * this.resolution;
		this.map.width = this.width;
		this.map.height = 40 * this.resolution;
		this.height = this.canvas.clientHeight * this.resolution;
		this.canvas.width = this.width;
		this.canvas.style.width = this.elem.clientWidth + 'px';
		this.canvas.style.height = this.canvas.clientHeight + 'px';
		this.overlayCont.style.height = this.canvas.clientHeight + 'px';
		this.canvas.height = this.height;

		this.grid.width = this.width;
		this.grid.height = this.height;
		this.grid.style.width = this.canvas.clientWidth + 'px';
		this.grid.style.height = this.canvas.clientHeight + 'px';

		const {x1, x2, p1, p2} = this.current;
		this.current = this._getTargetFrame(x1, x2, this.width, this.height, p1, p2);
		delete this.xLabelType;
		delete this.xLabelStep;
		this._drawFrame();
		this._drawMap();

		
	}

	_updateActiveX(start, end) {
		let xStart, xEnd;
		this.x.forEach((x, i) => { // TODO optimization
			if (!i) {
				return;
			} else if (x >= start && !xStart) {
				xStart = x === start || i === 1 ? i : i - 1;
			} else if (x >= end && !xEnd) {
				xEnd = x === end || i === this.x.length - 1 ? i : i + 1;
			}
		});
		if (xStart > xEnd) {
			[xStart, xEnd] = [xEnd, xStart];
		}

		return [xStart, xEnd];
	}

	_getTargetFrame(x1, x2, width, height, p1, p2) {
		let y1, y2;
	
		this.lines.forEach((line) => {
			if (!this.activeLines[line[0]]) {
				return;
			}
			for (let i = p1; i <= p2; i++) {
				if (line[i]) {
					if (!y2) {
						y2 = y1 = line[i];
					} else if (line[i] > y2) {
						y2 = line[i];
					} else if (line[i] < y1) {
						y1 = line[i];
					}
				}
			}
		});
		
		x1 = x1 || 1;
		x2 = x2 || 0;
		let padding = this.thickness / (y2 === y1 ? 1 : height / (y2 - y1));

		y1 = 'minY' in this.config && y1 > this.config.minY ? this.config.minY : (y1 - padding) || this.current.y1 || 0;
		y2 = (y2 + padding) || this.current.y2 || 1;
		return {
			x1, x2, y1, y2, p1, p2, 
			s2: y2 === y1 ? 1 : height / (y2 - y1),
			s1: x2 === x1 ? 1 : width / (x2 - x1)
		};
	}

	_updateActiveLines() {
		this.lines = this.columns.filter((column, i) => {
			const key = column[0];
			if (!column || !column.length) {
				return false;
			}
			if (this.activeLines[key]) {
				return true;
			}
		});
	}

	_getCurrentFrame() {
		if (!this.isAnim) {
			return this.current;
		}

		let delta = Date.now() - this.animStart,
			t = this.target,
			p = this.prev;

		if (delta > 140 || (t.y2 === p.y2 && t.y1 === p.y1 && t.x2 === p.x2 && t.x1 === p.x1)) {
			this.isAnim = false;
			this._updateActiveLines();
			return t;
		}
		let y2 = p.y2 + (t.y2 - p.y2) * delta / 140,
			y1 = p.y1 + (t.y1 - p.y1) * delta / 140,
			x2 = p.x2 + (t.x2 - p.x2) * delta / 140,
			x1 = p.x1 + (t.x1 - p.x1) * delta / 140;

		const [p1, p2] = this._updateActiveX(x1, x2);

		return {
			x1, x2, y1, y2, p1, p2,
			s1: x2 === x1 ? 1 : this.width / (x2 - x1),
			s2: y2 === y1 ? 1 : this.height / (y2 - y1)
		};
	}

	_startMainAnim(x1 = this.current.x1, x2 = this.current.x2) {
		this.animStart = Date.now();
		this.prev = this.current;
		const [p1, p2] = this._updateActiveX(x1, x2);
		this.target = this._getTargetFrame(x1, x2, this.width, this.height, p1, p2);
		!this.isAnim && this._drawFrame();
		this.isAnim = true;
	}

	_drawFrame() {
		requestAnimationFrame(this._update);
	}

	_update() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.current = this._getCurrentFrame();

		this._updateGrid();

		this.pointsX = [];
		this.pointsY = [];
		const { x1 , s1, p1, p2 } = this.current;

		for (let i = p1; i <= p2; i++) {
			this.pointsX.push(s1 * (this.x[i] - x1));
		}

		this.lines.forEach((line) => {
			const color = this.colors[line[0]];
			this._updateLine(line, color);
		});

		this._drawXLabels();

		this.isAnim && this._drawFrame();
	}

	_updateLine(line, color) {
		const { y2, s2, p1, p2 } = this.current;
		let pointsY = [];
		pointsY.push(s2 * (y2 - line[p1]));
		
		this.context.beginPath();
		this.context.moveTo(this.pointsX[0], pointsY[0]);
		for (let i = p1 + 1; i <= p2; i++) {
			const y = s2 * (y2 - line[i]);
			pointsY.push(y)
			this.context.lineTo(this.pointsX[i - p1], y);
		}
		this.context.strokeStyle = color;
		this.context.lineWidth = this.thickness * this.resolution;
		this.context.stroke();
		this.pointsY.push(pointsY);
	}


	_updateGrid() {
		const { y1, y2, s2 } = this.current;
		if (this.prev && this.prev.y1 === y1 && this.prev.y2 === y2 && this.prev.s2 === s2) {
			return;
		}
		this.gContext.clearRect(0, 0, this.grid.width, this.grid.height);
		const counts = Math.max(this.height / (50 * this.resolution), 1);
		const step = calcStepSize(y2-y1, counts);
		let y = y1;
		let html = '';
		
		while (true) {
			let p = s2 * (y2 - y);
			if (!p || p < 5) {
				break
			}
			this.gContext.beginPath();
			this.gContext.moveTo(0, p);
			this.gContext.lineTo(this.width, p);
			this.gContext.strokeStyle = '#aaa';
			this.gContext.lineWidth = 0.5 * this.resolution;
			this.gContext.stroke();
			html += `<div style="transform: translateY(${-(s2 * (y - y1) / this.resolution)}px);">${formatNumber(y)}</div>`;
			if (y % step !== 0){
				let newY = Math.floor(y / step) * step;
				if ((y - newY) / step > 0.7) {
					newY+= step;
				}
				y = newY;
			}
			y += step;
		}
		this.yLabelsElem.innerHTML = html;
	}

	_initBadges() {
		let timer;
		this.badges.addEventListener('click', (e) => {
			let elem = e.target;
			while (elem !== this.badges && !elem.classList.contains('badges-item') ) {
				elem = elem.parentNode;
			}
			if (!elem || elem === this.badges) {
				return;
			}
			const id = elem.dataset.id;
			const wasActive = this.activeLines[id];
			elem.classList.toggle('badges-item--inactive', wasActive);
			this.activeLines[id] = !this.activeLines[id];
			if (!wasActive) {
				this._updateActiveLines();
			}
			
			this._startMainAnim();
			clearTimeout(timer);
			timer = setTimeout(() => this._drawMap(), 160);
		});
	}

	_initVerticals() {
		this.overlay.addEventListener('mousemove', (e) => {
			this.mouseX = e.offsetX;
			if (this.showVerticals && this.pointsX) {
				this.vDiv.style.display = 'block';
				this.tooltip.style.display = 'flex';
				this._updateVerticals();
			}
		});
		this.overlay.addEventListener('mouseleave', () => {
			this.vDiv.style.display = 'none';
			this.tooltip.style.display = 'none';
		});
	}
	_drawMap() {
		requestAnimationFrame(this._updateMap);
	}

	_updateMap() {
		let xStart = 1, xEnd = this.x.length - 1;
		const { y2, s2, x1 , s1 } = this._getTargetFrame(this.x[xStart] , this.x[xEnd], this.map.width, this.map.height, xStart , xEnd);
		let mapPointsX = [];

		for (let i = 1; i < this.x.length; i++) {
			mapPointsX.push(s1 * (this.x[i] - x1));
		}
		this.mContext.clearRect(0, 0, this.map.width, this.map.height);

		this.lines.forEach((line, j) => {
			if (!this.activeLines[line[0]]) {
				return;
			}
			const color = this.colors[line[0]];
			
			this.mContext.beginPath();
			this.mContext.moveTo(mapPointsX[0], s2 * (y2 - line[1]));
			for (let i = 1 + 1; i <= this.x.length - 1; i++) {
				const y = s2 * (y2 - line[i]);
				this.mContext.lineTo(mapPointsX[i - 1], y);
			}
			this.mContext.strokeStyle = color;
			this.mContext.lineWidth = 0.5 * this.resolution;
			this.mContext.stroke();
		});
	}

	_drawXLabels(type = this.xLabelType || 3) { // 1 - d, 2 - m, 3 - y
		let labels = this.xLabels[type],
			max = 2 * Math.floor(this.width / (this.resolution * 120)),
			step = 1,
			start = Math.max(this._getDiff(labels.start, new Date(this.current.x1), type), 0),
			end = Math.ceil(this._getDiff(labels.start, new Date(this.current.x2), type)),
			diff;

		while(true) {
			diff = (Math.ceil(end / step) - Math.floor(start / step));
			if (diff > max) {
				step *= 2;
			} else {
				break
			}
		}

		if (step === 1 && diff < max / 2 && type > 1) {
			delete this.xLabelStep;
			this._drawXLabels(type - 1);
			return;
		}
		this.xLabelType = type;
		step = this.xLabelStep || step;
		this.xLabelStep = step;
		let dates = [],
			offsets = [],
			offset = Math.ceil(start / step) * step,
			year = labels.start.getFullYear(), month = labels.start.getMonth(), day = labels.start.getDate();

		for (let i = 0; i <= diff +1; i++) {
			let p;
			if (type === 1) {
				p = new Date(year, month, day + offset + i * step);
			} else if (type === 2) {
				p = new Date(year, month + offset + i * step, 1);
			} else {
				p = new Date(year + offset + i * step, 0, 1);
			}
			dates.push(p)
			offsets.push((p - this.current.x1) * this.current.s1);
		}
		
		this.xLabelsElem.innerHTML = dates.reduce((mem, d, i) => {
			if (offsets[i] < 0 || offsets[i] > this.width) {
				//return mem;
			}
			let style = `transform: translateX(${offsets[i] / this.resolution }px);`;
			return mem + `<div style="${style}">${formatDate(d, type)}</div>`
		}, '');

	}

	_updateVerticals() {
		const active = binarySearch(this.pointsX, this.mouseX * this.resolution);
		if (active < 0) {
			return;
		}
		const { s2, y1 } = this.current;
		this.vDiv.style.transform = `translateX(${this.pointsX[active] / this.resolution}px)`;
		let i = active + this.current.p1,
			x = this.x[i],
			points = '',
			left = '',
			rigth = '';
		
		this.lines.forEach((y, j) => {
			if (y[i] === undefined) {
				return;
			}
			let c = this.colors[y[0]];
			points += `<div class="tooltip-point" style="border: 2px solid ${c}; transform: translateY(-${(s2 * (y[i] - y1))/ this.resolution}px);"></div>`;
			let html = `<div style="color: ${c};">`+
				`<div class="tooltip-value">${
					formatNumber(y[i])
				}</div>`+
				`<div class="tooltip-text">${
					this.names[y[0]]
				}</div>`+
			`</div>`;
			if (j%2) {
				rigth += html;
			} else {
				left += html;
			}
		})
		
		this.tooltip.innerHTML = 
			`<div class="tooltip-cont">`+
				`<div>${(new Date(x)).toLocaleString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</div>`+
				`<div class="tooltip-items">`+
					`<div class="tooltip-item">${left}</div>`+
					`<div class="tooltip-item">${rigth}</div>`+
				`</div>`+
			`</div>`;
			this.vDiv.innerHTML = points;
	}

	_getDiff(x1,x2,type) {
		let d1 = new Date(x1),
			d2 = new Date(x2),
			diff;

		if (type === 1) {
			d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
			d2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
			diff = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
		} else if (type === 2) {
			diff = 12 * (d2.getFullYear() - d1.getFullYear()) + d2.getMonth() - d1.getMonth();
		} else {
			diff = d2.getFullYear() - d1.getFullYear();
		}
		return diff;
	}

	_initXLabels(type = 3) { // 1 - d, 2 - m, 3 - y
		let d1 = new Date(this.x[1]),
			start;

		if (type === 1) {
			d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate() - 1);
		} else if (type === 2) {
			if (d1.getDate() !== 1) {
				d1 = new Date(d1.getFullYear(), d1.getMonth() - 1, 1);
			}
		} else {
			if (d1.getDate() !== 1 || d1.getMonth() !== 0) {
				d1 = new Date(d1.getFullYear() + 1, 0, 1);
			}
		}

		let year = d1.getFullYear(), month = d1.getMonth(), day = d1.getDate();

		if (type === 1) {
			start = new Date(year, month, day);
		} else if (type === 2) {
			start = new Date(year, month, 1);
		} else {
			start = new Date(year, 0, 1);
		}

		this.xLabels[type] = { start };
		type > 1 && this._initXLabels(type - 1);
	}

	_initMap() {
		let isLeft, isRight, startClientX = 0, interval = this.x[this.x.length - 1] - this.x[1];

		const onTouchStart = (e, type) => {
			e.preventDefault();
			if (e.touches.length === 1){
				handleDragStart(e.touches[0].clientX, type);
				document.addEventListener('touchmove', onTouchMove);
				document.addEventListener('touchend', onTouchEnd);
				document.addEventListener('touchcancel', onTouchEnd);
			}
		}

		const onTouchMove = (e) => {
			if( e.touches.length  === 1){
				handleDragging(e.touches[0].clientX);
			}
		}

		const onTouchEnd = (e) => {
			e.preventDefault();
			if( e.touches.length  === 0){
				handleDragStop();
				document.removeEventListener('touchmove', onTouchMove);
				document.removeEventListener('touchend', onTouchEnd);
				document.removeEventListener('touchcancel', onTouchEnd);
			}
		}

		const onMouseDown = (e, type) => {
			e.preventDefault();
			document.addEventListener('mouseup', onMouseUp);
			document.addEventListener('mousemove', onMouseMove);
			handleDragStart(e.clientX, type);
		}

		const onMouseMove = (e) => {
			handleDragging(e.clientX);
		}

		const handleDragging = throttle((clientX = startClientX) => {
			let delta = (clientX - startClientX) / (this.scale.offsetWidth), 
				x1, x2, frame = this.target || this.current,
				scale = (this.scale.offsetWidth - 12) / interval;
			if (isLeft) {
				let min = this.x[1], max = this.x[frame.p2 - 1];
				x1 = frame.x1 + delta * interval;
				x1 = x1 < max ? (x1 > min ? x1 : min) : max;
				if (delta < 0) {
					delete this.xLabelType;
				}
				delete this.xLabelStep;
				left.style.transform = `translateX(${scale * (x1 - this.x[1])}px)`;
			} else if (isRight) {
				let min = this.x[frame.p1 + 1], max = this.x[this.x.length - 1];
				x2 = frame.x2 + delta * interval;
				x2 = x2 < max ? (x2 > min ? x2 : min) : max;
				if (delta > 0) {
					delete this.xLabelType;
				}
				delete this.xLabelStep;
				right.style.transform = `translateX(${12 + scale * (x2 - this.x[1])}px)`;
			} else {
				let min = this.x[1], max = this.x[this.x.length - 1];
				x1 = frame.x1 + delta * interval;
				x2 = frame.x2 + delta * interval;
				if (x2 > max) {
					x1 = max - frame.x2 + frame.x1;
					x2 = max;
				} else if (x1 < min) {
					x1 = min;
					x2 = min + frame.x2 - frame.x1;
				}

				left.style.transform = `translateX(${scale * (x1 - this.x[1])}px)`;
				right.style.transform = `translateX(${12 + scale * (x2 - this.x[1])}px)`;
			}
			
			this._startMainAnim(x1 || frame.x1, x2 || frame.x2);
			startClientX = clientX;
		}, 100)

		const onMouseUp = (e) => {
			document.removeEventListener('mouseup', onMouseUp);
			document.removeEventListener('mousemove', onMouseMove);
			e.preventDefault();
			handleDragStop();
		}

		const handleDragStop = () => {
			this.showVerticals = true;
		}

		const handleDragStart = (clientX, type) => {
			isLeft = type == 1;
			isRight = type == 2;
			startClientX = clientX;

			this.showVerticals = false;
		}

		let left = this.scale.querySelector('.scale-left');
		left.addEventListener('touchstart', e => onTouchStart(e, 1));
		left.addEventListener('mousedown',  e => onMouseDown(e, 1));
		let right = this.scale.querySelector('.scale-right');
		right.addEventListener('touchstart', e => onTouchStart(e, 2));
		right.addEventListener('mousedown',  e => onMouseDown(e, 2));
		let center = this.scale.querySelector('.scale-center');
		center.addEventListener('touchstart', e => onTouchStart(e, 3));
		center.addEventListener('mousedown',  e => onMouseDown(e, 3));

		handleDragging();
		right.style.display = 'block';
		left.style.display = 'block';
	}
}

let nightMode = false;
let switchMode = document.querySelector('#switchMode');
switchMode.addEventListener('click', () => {
	nightMode = !nightMode;
	document.body.classList.toggle('night-mode', nightMode);
	switchMode.innerHTML = nightMode ? 'Switch to Day Mode' : 'Switch to Night Mode';
});

(new Chart(chartData[0], {
	minY: 0
})).draw(document.querySelector('#container1'));
(new Chart(chartData[1], {
	minY: 0
})).draw(document.querySelector('#container2'));
(new Chart(chartData[2], {
	//minY: 0
})).draw(document.querySelector('#container3'));
(new Chart(chartData[3], {
	minY: 0
})).draw(document.querySelector('#container4'));
(new Chart(chartData[4], {
	minY: 0
})).draw(document.querySelector('#container5'));
