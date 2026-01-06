import ControllerExtension from 'sap/ui/core/mvc/ControllerExtension';
import ExtensionAPI from 'sap/fe/templates/ObjectPage/ExtensionAPI';
import JSONModel from 'sap/ui/model/json/JSONModel';
import Fragment from 'sap/ui/core/Fragment';
import Popover from 'sap/m/Popover';
import View from 'sap/ui/core/mvc/View';
import Event from 'sap/ui/base/Event';
import Control from 'sap/ui/core/Control';
import Dialog from 'sap/m/Dialog';
import Guid from 'sap/ui/model/odata/type/Guid';
import ODataModel from 'sap/ui/model/odata/v4/ODataModel';
import MessageToast from 'sap/m/MessageToast';

/**
 * @namespace com.ya.products.ext.controller
 * @controller
 */
export default class ProductObjectPage extends ControllerExtension<ExtensionAPI> {
	private _pPopover: Promise<Popover> | null = null;
	Dialog: Dialog;

	static overrides = {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.ya.products.ext.controller.ProductObjectPage
		 */
		onInit(this: ProductObjectPage) {
			// you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
			const model = this.base.getExtensionAPI().getModel();
			this.formModel();
		}
	}

	private formModel(): void {
		let data: {
			year: String;
			month: String,
			quantity: number
		} = {
			year: "",
			month: "",
			quantity: 0
		};

		const model = new JSONModel(data);
		((this.base as any).getView() as View).setModel(model, "form");;

	}

	public async onSelectionChange(oEvent: Event): Promise<void> {
		const oChart = oEvent.getSource() as Control;
		const aSelectedData = (oEvent as any).getParameter("data") as any[];
		const oExtensionAPI = this.base as any;
		const oView = oExtensionAPI.getView() as View;

		if (!aSelectedData || aSelectedData.length === 0) {
			if (this._pPopover) {
				const oPopover = await this._pPopover;
				oPopover.close();
			}
			return;
		}

		const oData = aSelectedData[0].data;

		const oDisplayData = {
			year: oData.year,
			month: oData.month,
			quantity: oData.Sales
		};

		let oModel = oView.getModel("popoverModel") as JSONModel;
		if (!oModel) {
			oModel = new JSONModel(oDisplayData);
			oView.setModel(oModel, "popoverModel");
		} else {
			oModel.setData(oDisplayData);
		}

		if (!this._pPopover) {
			this._pPopover = Fragment.load({
				id: oView.getId(),
				name: "com.ya.products.ext.fragment.ChartPopover",
				controller: this
			}) as Promise<Popover>;

			const oPopover = await this._pPopover;
			oView.addDependent(oPopover);

		}

		const oPopoverToOpen = await this._pPopover;

		if (oPopoverToOpen.isOpen()) {
			oPopoverToOpen.close();
		}

		oPopoverToOpen.openBy(oChart);

	}

	public async onOpenSalesDialog(): Promise<void> {
		const oExtensionAPI = this.base as any;
		const oView = oExtensionAPI.getView() as View;

		this.Dialog ??= await Fragment.load({
			id: oView.getId(),
			name: "com.ya.products.ext.fragment.Form",
			controller: this
		}) as Dialog;

		const oDialog = this.Dialog;
		oView.addDependent(oDialog);
		oDialog.bindElement({
			path: './',
			model: ''
		})

		oDialog.open();
	}


	public onCloseSales(): void {
		this.Dialog.close();
	}

	public async onSaveSales(): Promise<void> {
		const oExtensionAPI = this.base as any;
		const oView = oExtensionAPI.getView() as View;
		const oModel = oView.getModel("form") as JSONModel;
		const oFormData = oModel.getData();
		const oMainModel = oView.getModel() as ODataModel;

		const oContext = oView.getBindingContext();
		const sProductId = oContext?.getProperty("ID") as Guid;
		const sYear = oFormData.year as string;
		const sMonth = oFormData.month as string;
		const sQuantityString = oFormData.quantity as string;
		const sQuantityInt = Number(sQuantityString); // Convertido a number/int32


		oModel.setData({
			year: "",
			month: "",
			quantity: 0
		});


		if (!sProductId) {
			console.error("No se pudo obtener el ID del producto.");
			return;
		}

		const oEditFlow = this.base.getExtensionAPI().getEditFlow();

		try {
			await oEditFlow.invokeAction("setSales", {
				skipParameterDialog: true, // Evita que Fiori Elements pida los datos otra vez
				parameterValues: [
					{ name: "id", value: sProductId },
					{ name: "year", value: sYear },
					{ name: "month", value: sMonth },
					{ name: "quantity", value: sQuantityInt }
				],
				model: oMainModel
			});

			this.onCloseSales();

			MessageToast.show("Sale successfully created");

			if (oContext) {
				// Reemplaza 'toSales' por el nombre exacto de la Navigation Property 
				// que conecta tu Producto con sus Ventas (la que usa el gráfico)
				(oContext as any).requestSideEffects([
					{ $NavigationPropertyPath: 'toSales' }
				]);
			}

		} catch (oError: any) {
			console.error("Error al invocar setSales:", oError);
		}

	}

	public onNavToDetails(): void {
		const oExtensionAPI = this.base.getExtensionAPI();
		const oView = (this.base as any).getView() as View;
	    const oContext = oView.getBindingContext();
		const isActiveEntity = oContext?.getProperty("IsActiveEntity")  as Boolean;

		// Obtenemos los datos que guardamos previamente para el Popover
		const oPopoverModel = oView.getModel("popoverModel") as JSONModel;
		const oData = oPopoverModel.getData();

		console.log(oData);

		// Obtenemos el ID del producto (key) del contexto de la página actual
		const sProductId = oContext?.getProperty("ID");

		// Navegación hacia la Custom Page con los 3 parámetros
		oExtensionAPI.getRouting().navigateToRoute("SalesReviewPage", {
			key: sProductId,
			boolean1: isActiveEntity,
			toSalesKey: sProductId,
			year: oData.year,
			month: oData.month,
			boolean2: isActiveEntity
		});
	}

}

