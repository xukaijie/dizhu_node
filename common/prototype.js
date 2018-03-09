

/*增加原生js的原型链函数*/

Array.prototype.contains = function(obj){

    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;

}