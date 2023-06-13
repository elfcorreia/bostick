// container of views
class Page {
	
	// must be override
	onCreate() { console.log('Page.onCreate called'); }
	onShow() { console.log('Page.onShow called'); }
	onHide() { console.log('Page.onHide called'); }
	onViewCreated() { console.log('Page.onViewCreated called'); }
	installView(viewName, el) { console.log('Page.installView called'); }

	constructor() {
		this.views = {};
		this.currentViewName = null;
		this.viewsRootElement = {};
	}

	registerView(name, v) {
		this.views[name] = v;	
	}

	showView(viewName) {
		console.log(`Page.showView ${viewName} called`);
		if (this.currentViewName == viewName) {
			return;
		}
		console.log(this.views);
		if (this.views[viewName] === undefined) {
			throw new Error(`View ${viewName} not found!`);
		}
		if (this.viewsRootElement[viewName] === undefined) {
			let re = document.createElement('div');
			re.id = viewName;
			this.onViewCreated(viewName);
			this.installView(viewName, re);
			this.views[viewName].onCreate(re);
			this.viewsRootElement[viewName] = re;
			console.log(this.viewsRootElement);
		}
		this.views[viewName].onShow();
		this.currentViewName = viewName;
	}

	hideView(viewName) {
		console.log(`Page.hideView ${viewName} called`);
		if (this.viewsRootElement[this.currentViewName]) {
			this.views[this.currentViewName].onHide();
			this.viewsRootElement[this.currentViewName].style.display = 'none';					
		}
	}

	getCurrentViewName() {
		return this.currentViewName;
	}

	getViewsNames() {
		return Object.keys(this.views);
	}

	run() {
		this.onCreate();			
	}

	loadScript(url) {
		return new Promise((res, err) => {
			const newScript = document.createElement("script");
			newScript.onerror = (oError) => err(oError);
			newScript.onload = () => res();
			document.head.appendChild(newScript);
			newScript.src = url;
		});
	}
}

class View {
	onCreate() { }
	onShow() { }
	onHide() { }
}

class EmptyView extends View {
	onCreate() {
		this.root = document.createElement('div');
		this.root.innerHTML = '(Empty View)';
	}
}

class PageViewListView extends View {

	constructor(page, skipsViews) {	
		super();	
		this.page = page;
		this.skipsViewsNames = [];
	}

	onCreate(el) {
		el.innerHTML = '<span>Views: </span>';
		el.style.border = 'dashed 2pt red';
		el.style.margin = '5px';
		el.style.padding = '5px';
		el.style.float = 'left';
		
		let select = document.createElement('select');
		el.append(select);

		let handler = (e) => {				
			let cvn = this.page.getCurrentViewName();
			if (cvn === e.target.value) {
				return;
			}
			if (cvn !== undefined && this.skipsViewsNames.indexOf(cvn) === -1) {
				this.page.hideView(cvn);
			}
			this.page.showView(e.target.value);
		};
		for (let v of this.page.getViewsNames()) {
			if (this.skipsViewsNames.indexOf(v) !== -1) {
				continue;
			}
			let option = document.createElement('option');
			option.innerText = v;
			option.value = v;
			select.append(option);
		}
		select.addEventListener('change', handler);
	}

	addSkipViewName(name) {
		this.skipsViewsNames.push(name);
	}
}

class OriginalTabularView extends View {

	onCreate() {
		let c = document.getElementById('container');
		c.style.width = '960px';
		c.style.overflowX = 'scroll';		
		console.log('OriginalTabularView called');
		this.table = document.querySelector('table');		
	}
	onShow() {
		this.table.style.display = 'table';
	}
	onHide() {
		this.table.style.display = 'none'; 
	}
}

class CardsView {

	constructor(dataSource) {
		this.dataSource = dataSource;
	}

	createFilterForm() {
		this.filterGroupBy = document.createElement('select');
		let valores = {
			atribuido: 'atribuído',
			departamento: 'department',
			status: 'status'
		};
		for (let i in valores) {
			let option = document.createElement('option');
			option.value = valores[i];
			option.innerText = i;
			this.filterGroupBy.append(option);
		}
		this.filterWrapper.append(this.filterGroupBy);

		this.filterShow = document.createElement('div');
		this.filterWrapper.append(this.filterShow);
	}

	onCreate(el) {
		this.rootView = el;
		this.rootView.style.padding = '5px';
		this.rootView.style.backgroundColor = 'gray';
		this.filterWrapper = document.createElement('div');
		this.filterWrapper.style.backgroundColor = 'white';
		this.filterWrapper.style.padding = '5px';
		this.filterWrapper.style.marginBottom = '5px';
		this.filterWrapper.style.borderRadius = '5px';
		this.rootView.append(this.filterWrapper);
		this.createFilterForm();
		this.contentWrapper = document.createElement('div');
		this.contentWrapper.style.backgroundColor = 'white';
		this.contentWrapper.style.padding = '5px';
		this.contentWrapper.style.borderRadius = '5px';
		this.rootView.append(this.contentWrapper);

		// cria o callback
		this.update = () => {
			console.log('updateView called');
			let groups = {};
			let cards = {};
			this.contentWrapper.innerHTML = '';
			let groupByFieldName = this.filterGroupBy.value;
			for (let row of this.dataSource.getData()) {
				console.log(row);
				if (!groups[row[groupByFieldName]]) {
					let wrapper = document.createElement('div');
						let title = document.createElement('p');
							title.innerText = row[groupByFieldName];
							title.style.padding = '1.5rem 1rem';
							title.style.fontSize = '1.25rem';
						wrapper.appendChild(title);
						let cardsWrapper = document.createElement('div');
							cardsWrapper.style.display = 'grid';
							cardsWrapper.style.gridTemplateColumns = '1fr 1fr 1fr 1fr';
							cardsWrapper.style.gridGap = '10px';
						wrapper.append(cardsWrapper);
					groups[row[groupByFieldName]] = wrapper;
					cards[row[groupByFieldName]] = cardsWrapper;
				}

				let card = document.createElement('a');
				card.href = row.link;
				card.style.padding = '1rem';
				card.style.borderRadius = '5px';
				card.style.boxShadow = 'rgba(9, 30, 66, 0.25) 0px 1px 1px, rgba(9, 30, 66, 0.13) 0px 0px 1px 1px';
				card.innerHTML = '<small>#' + row.chamado + '</small>';
				card.innerHTML += '<p>' + row.assunto + '</p>';
				cards[row[groupByFieldName]].append(card);
			}			
			let keys = Object.keys(groups).sort();

			this.filterShow.innerHTML = '';
			for (let k of keys ) {
				this.contentWrapper.append(groups[k]);
			}			
		}
		this.filterGroupBy.addEventListener('change', this.update);

		this.rootView.style.flexDirection = 'column';
	}	

	onShow() {
		console.log('CardsView.onShow called');
		this.rootView.style.display = 'flex';
		this.update();
	}

	onHide() {
		console.log('Card onHide');
	}
}

class TicketsPage extends Page {	

	onCreate() {
		console.log('TicketsPage.onCreated called');
		let vl = new PageViewListView(this);
		this.registerView('viewlist', vl);
		vl.addSkipViewName('viewlist');
		
		let original = new OriginalTabularView();
		this.registerView('original', original);

		let cards = new CardsView(this);
		this.registerView('cards', cards);

		this.getData();
		this.showView('viewlist');
		this.showView('original');
	}

	installView(viewName, el) {
		let p = null;
		switch (viewName) {
		case 'viewlist':			
			let pe = document.getElementById(el.id);
			if (pe) {
				pe.parentNode.removeChild(pe);
			}
			p = document.querySelector('.configureQ');			
			p.parentNode.insertBefore(el, p.nextSibling);
			break;
		case 'original':
			// ignore
			break;		
		default:
			p = document.querySelector('table');
			console.log(p);
			p.parentNode.insertBefore(el, p.nextSibling);
			break;
		}
	}

	getData() {
		this.columns = [];
		if (!this.data) {
			let ths = Array.from(document.querySelectorAll('table tr th')).map(el => el.innerText).filter(v => v !== undefined);

			for (let c of ths) {
				let cn = c.slice(0, 1).toLowerCase() + c.slice(1).replace(' ', '').replace('.', '').replace(':', '');
				this.columns.push(cn);
			}

			let dados = Array.from(document.querySelectorAll('table tr')).slice(1);
			this.data = [];
			for (let row of dados) {
				let obj = {};				
				let link = row.querySelector('a');				
				obj.link = link.href;

				let tds = Array.from(row.querySelectorAll('td')).map(el => el.innerText);
				for (let idx in this.columns) {
					obj[this.columns[idx]] = tds[idx];
				}
				this.data.push(obj);
			}			
		}
		return this.data;
	}
}



class VisaoCluster {
	constructor() {
		this.name = "Cluster";
	}
	
	onCreate(rootView) {
		this.rootView = rootView;
	}
	onUpdate(data) {
		this.data = data;
	}

	onShow() {
		console.log('Cluster onShow');		
	}

	onHide() {
		console.log('Cluster onHide');
	}
}

new TicketsPage().run();

//
//	let root_el = document.createElement('div');
//	document.querySelector('table').parentElement.append(root_el);
//	root_el.style.display = 'grid';
//	root_el.style.gridTemplateColumns = '1fr 1fr 1fr';
//	let dados = this.pick();
//	for (linha of dados) {
//		let card = document.createElement('div');
//		card.style.border = 'solid 1pt black';
//		for (campo of linha) {
//			let p = document.createElement('p');
//			p.innerText = campo;
//			card.append(p);
//		}
//		root_el.append(card);
//	}
//})();