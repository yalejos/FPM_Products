import Controller from "sap/fe/core/PageController";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import Utils from "../../utils/Utils";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import Context from "sap/ui/model/odata/v4/Context";




/**
 * @namespace com.ya.products.ext.view
 */
export default class Review extends Controller {
    private oUtils: Utils = new Utils();

    public onInit(): void {

        const oSalesModel = new JSONModel({
            results: [],
            busy: false,
            filterInfo: {}
        });

        (this.getView() as View).setModel(oSalesModel, "sales");
        const router = this.getAppComponent().getRouter();
        router.getRoute("SalesReviewPage")?.attachPatternMatched(this._onRouteMatched.bind(this));

    }

    private async _onRouteMatched(oEvent: any): Promise<void> {

        const sUrl = window.location.hash;
        const oData = this.oUtils.extractDataFromUrl(sUrl);

        console.log("Datos extraídos de la URL por Utils:", oData);


        if (oData.id && oData.month && oData.year) {
            await this._callGetQuantitySales(oData.id, oData.month, oData.year);
        }


        // if (oData.id && oData.month && oData.year) {
        //     this._loadSalesData(oData.id, oData.month, oData.year, true);
        // }


        // const mParameters = oEvent.getParameter("arguments");
        // console.log("Parámetros recibidos:", mParameters);

        // const { key, month, year, boolean2 } = mParameters;

        // // Actualizar info de filtros en el modelo
        // const oSalesModel = this.getView()?.getModel("sales") as JSONModel;
        // oSalesModel?.setProperty("/filterInfo", {
        //     productId: key,
        //     month: month,
        //     year: year,
        //     boolean2: boolean2
        // });

        // // Llamar a la carga de datos
        // this._loadSalesData(key, month, year, boolean2);
    }
    private async _callGetQuantitySales(sId: string, sMonth: string, sYear: string): Promise<void> {
        const oView = this.getView() as View;
        const oSalesModel = oView.getModel("sales") as JSONModel;
        const oMainModel = oView.getModel() as ODataModel;

        console.log(sId);
        const oParameters =
            [
                { name: "id", value: sId },
                { name: "year", value: sYear },
                { name: "month", value: sMonth }
            ];

        oSalesModel.setProperty("/busy", true);

        try {
            const oEditFlow = (this as any).getExtensionAPI().getEditFlow();
            const oResponse = await oEditFlow.invokeAction("getQuantitySales", {
                skipParameterDialog: true,
                parameterValues: oParameters,
                model: oMainModel
            });
            const aData = oResponse.results;
            oSalesModel.setProperty("/results", aData);

            console.log("Datos de la acción cargados en modelo 'sales':", aData);

        } catch (oError: any) {
            console.error("Error al invocar getQuantitySales:", oError);
        }
    }

    private async _loadSalesData(sId: string, sMonth: string, sYear: string, sBoolean: any): Promise<void> {
        const oView = this.getView() as View;
        const oModel = oView.getModel(); // Main OData V4 Model
        const oSalesModel = oView.getModel("sales") as JSONModel;

        const bActive = (sBoolean === "true" || sBoolean === true);

        oSalesModel.setProperty("/busy", true);

        try {
            // Create a binding to the toSales navigation property with filters
            // Adjust the path based on your actual OData structure
            const sPath = `/Products(ID=${sId},IsActiveEntity=${bActive})/toSales`;
            const sFilter = `month eq '${sMonth}' and year eq '${sYear}' and product_ID eq ${sId}`;
            const oListBinding = oModel?.bindList(sPath, undefined, undefined, [], {
                "$filter": sFilter
            }) as ODataListBinding;
            const aContexts = await oListBinding?.requestContexts(0, 100);
            const aData = aContexts.map((oCtx: any) => oCtx.getObject());

            console.log("Datos recibidos con éxito:", aData);
            oSalesModel.setProperty("/results", aData);
        } catch (oError: any) {
            console.error("Error loading sales data", oError);
        } finally {
            oSalesModel.setProperty("/busy", false);
        }
    }

    public onNavBack(): void {
        (this as any).base.getExtensionAPI().getRouting().navigateBack();
    }

    public onRefresh(): void {
        const oSalesModel = new JSONModel({ results: [] });
        // The '!' after getView() asserts it is not undefined
        this.getView()!.setModel(oSalesModel, "sales");
        const { productId, month, year, boolean2 } = oSalesModel.getProperty("/filterInfo");
        this._loadSalesData(productId, month, year, boolean2);
    }
}