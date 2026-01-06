sap.ui.define([
    "sap/fe/core/PageController"
], function (PageController: { extend: (arg0: string, arg1: { onInit: () => void; }) => any; prototype: { onInit: { apply: (arg0: any, arg1: IArguments) => void; }; }; }) {
    "use strict";

    return PageController.extend("com.ya.products.ext.main.Main", {
        onInit: function () {
            // Muy importante llamar a la superclase
            PageController.prototype.onInit.apply(this, arguments);
        }
    });
});