class DrawSVG {
  #tables = new Map();
  #joinLines = new Map();
  #currentLineRef; // ref

  constructor(element) {
    this.svg = document.getElementById(element);
    this.svg.dataset.height = this.svg.parentElement.offsetHeight;
    this.svg.dataset.width = this.svg.parentElement.offsetWidth;
    this.currentLevel;
    this.currentTable = {}, this.currentLine = {};
    this.arrayLevels = [];
  }

  set tables(value) {
    this.#tables.set(value.id, value.properties);
  }

  get tables() { return this.#tables; }

  set currentLineRef(value) {
    this.#currentLineRef = this.svg.querySelector(`#${value}`);
  }

  get currentLineRef() { return this.#currentLineRef; }

  set joinLines(value) {
    this.#joinLines.set(value.id, value.properties);
  }

  get joinLines() { return this.#joinLines; }

  checkResizeSVG() {
    let maxHeightTable = [...this.svg.querySelectorAll('g.table')].reduce((prev, current) => {
      return (+current.dataset.y > +prev.dataset.y) ? current : prev;
    });
    if (1 - (+maxHeightTable.dataset.y / +this.svg.dataset.height) < 0.30) {
      this.svg.dataset.height = +this.svg.dataset.height + 60;
      this.svg.style.height = `${+this.svg.dataset.height}px`;
    }

    let maxWidthTable = [...this.svg.querySelectorAll('g.table')].reduce((prev, current) => {
      return (+current.dataset.x > +prev.dataset.x) ? current : prev;
    });
    if (1 - (+maxWidthTable.dataset.x / +this.svg.dataset.width) < 0.40) {
      this.svg.dataset.width = +this.svg.dataset.width + 180;
      this.svg.style.width = `${+this.svg.dataset.width}px`;
    }
  }

  drawTable() {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = this.currentTable.key;
    g.dataset.id = `data-${this.currentTable.id}`;
    g.classList.add('table');
    g.dataset.table = this.currentTable.table;
    g.dataset.schema = this.currentTable.schema;
    g.dataset.joins = this.currentTable.joins;
    g.dataset.tableJoin = this.currentTable.join;
    g.dataset.x = this.currentTable.x;
    g.dataset.y = this.currentTable.y;
    g.dataset.levelId = this.currentTable.levelId;
    Draw.svg.appendChild(g);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', this.currentTable.x);
    rect.setAttribute('y', this.currentTable.y);
    g.appendChild(rect);
    const aRect = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    aRect.setAttribute('attributeName', 'y');
    aRect.setAttribute('dur', '.15s');
    aRect.setAttribute('fill', 'freeze');
    rect.appendChild(aRect);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.innerHTML = this.currentTable.table;
    text.setAttribute('x', this.currentTable.x + 24);
    text.setAttribute('y', this.currentTable.y + 16);
    // text.setAttribute('fill', '#494949');
    // text.setAttribute('text-anchor', 'start');
    text.setAttribute('dominant-baseline', 'middle');
    g.appendChild(text);
    const a = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    a.setAttribute('attributeName', 'y');
    a.setAttribute('dur', '.15s');
    a.setAttribute('fill', 'freeze');
    text.appendChild(a);
    this.checkResizeSVG();
  }

  drawLine() {
    // console.log(this.currentLine.from, this.currentLine.to);
    if (Object.keys(this.currentLine).length === 0) return;
    const coordsFrom = {
      x: this.tables.get(this.currentLine.from).line.from.x,
      y: this.tables.get(this.currentLine.from).line.from.y
    };
    let coordsTo;
    if (typeof this.currentLine.to === 'object') {
      // coordinate e.offsetX, e.offsetY. In questo caso provengo da dragOver.
      coordsTo = { x: this.currentLine.to.x, y: this.currentLine.to.y };
    } else {
      // tabella To
      coordsTo = {
        x: this.tables.get(this.currentLine.to).line.to.x,
        y: this.tables.get(this.currentLine.to).line.to.y
      };
    }
    this.line = {
      x1: coordsFrom.x, // start point
      y1: coordsFrom.y,
      p1x: coordsFrom.x + 40, // control point 1
      p1y: coordsFrom.y,
      p2x: coordsTo.x - 40, // control point 2
      p2y: coordsTo.y,
      x2: coordsTo.x, // end point
      y2: coordsTo.y
    };
    const d = `M${this.line.x1},${this.line.y1} C${this.line.p1x},${this.line.p1y} ${this.line.p2x},${this.line.p2y} ${this.line.x2},${this.line.y2}`;
    this.currentLineRef = this.currentLine.key;
    this.currentLineRef.setAttribute('d', d);
    if (this.currentLineRef.hasChildNodes()) {
      const animLine = this.currentLineRef.querySelector('animate');
      animLine.setAttribute('to', d);
      animLine.beginElement();
    }
  }

  joinTablePositioning() {
    // recupero tutte le tabelle con data-joins > 1 partendo dal livello più alto (l'ultimo)
    // ciclo dal penultimo livello fino a 0 per riposizionare tutti gli elementi che hanno più di 1 join con altre tabelle
    this.arrayLevels.forEach(levelId => {
      // il primo ciclo recupera le tabelle del penultimo level (le tabelle dell'ultimo level non hanno altre tabelle collegate ad esse)
      this.svg.querySelectorAll(`g.table[data-level-id='${levelId}']:not([data-joins='1'], [data-joins='0'])`).forEach(table => {
        let y = 0;
        // verifico la posizione y delle tabelle legate in join con quella in ciclo
        for (let properties of this.tables.values()) {
          if (properties.join === table.id) y += properties.y;
        }
        // la tabella in ciclo verrà riposizionata in base a y calcolato.
        // Se sono presenti due tabelle in join con 'table' (in ciclo) le posizioni y di queste tabelle vengono sommate (nel for) e 
        // ...poi divise per il numero di tabelle join, in questo modo la tabella in ciclo viene posizionata al centro 
        this.tables.get(table.id).y = (y / table.dataset.joins);
        this.tables.get(table.id).line.from.y = (y / table.dataset.joins) + 15;
        this.tables.get(table.id).line.to.y = (y / table.dataset.joins) + 15;
        this.currentTable = this.tables.get(table.id);
        this.autoPosition();
      });
    });
    this.autoPositionLine();
  }

  autoPosition() {
    const tableRef = this.svg.querySelector(`#${this.currentTable.key}`);
    const rect = tableRef.querySelector('rect');
    const animRect = rect.querySelector('animate');
    const text = tableRef.querySelector('text');
    const animText = text.querySelector('animate');
    // sposto le tabelle con <animation>
    // stabilisco la posizione di partenza, nel from
    animRect.setAttribute('from', +tableRef.dataset.y);
    animText.setAttribute('from', +tableRef.dataset.y + 16);

    animText.setAttribute('to', this.currentTable.y + 16);
    animText.beginElement();
    animRect.setAttribute('to', this.currentTable.y);
    animRect.beginElement();

    // aggiorno i valori presenti nel DOM
    tableRef.dataset.y = this.currentTable.y;
    rect.setAttribute('y', this.currentTable.y);
    text.setAttribute('y', this.currentTable.y + 16);
    // verifico la posizione del max x/y all'interno dell'svg per fare un resize di width/height dell'svg
    this.checkResizeSVG();
  }

  autoPositionLine() {
    for (const [key, properties] of this.joinLines) {
      this.currentLine = properties;
      this.currentLineRef = key;
      // per ogni linea creo un'elemento <animation>
      const animLine = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animLine.setAttribute('attributeName', 'd');
      animLine.setAttribute('fill', 'freeze');
      animLine.setAttribute('dur', '.15s');
      animLine.setAttribute('from', this.currentLineRef.getAttribute('d'));
      this.currentLineRef.replaceChildren(animLine);
      this.drawLine();
    }
  }

}
