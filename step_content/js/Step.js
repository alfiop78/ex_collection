/*
timelineId = elemento id della class='timelineContent'
*/

class Steps {

  constructor(stepTranslate) {
    // definisco il div che deve effettuare la translate
    this._translate = document.getElementById(stepTranslate);
    this._page = document.querySelector('.step[selected]');
    console.log(this._page);
    console.log(this._page.offsetWidth);
    this._pageWidth = this._page.offsetWidth + 32; // width della pagina da translare
    console.log(this._pageWidth);

  }

  previous() {
    // this._pageWidth = this._page.offsetWidth + 32;
    this._translate.style.transform = "translateX("+(this._pageWidth-this._pageWidth)+"px)";
  }

  next() {
    // this._pageWidth = this._page.offsetWidth + 32;
    this.dataTranslateX = (this._pageWidth - this._translate.getAttribute('data-translate-x'));
    console.log('this.dataTranslateX : ', this.dataTranslateX);
    this._translate.style.transform = "translateX(-"+this.dataTranslateX+"px)";
    // this._translate.style.transform = "translateX(-"+this._pageWidth+"px)";
    this._translate.setAttribute('data-translate-x', -this.dataTranslateX);
  }

  goStep(e) {
    
  }

}
