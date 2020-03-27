var Promise = require("bluebird");
var xml2js = Promise.promisifyAll(require("xml2js"));

const LIST_SIZE = 8;

function topOfCurrentListCheck(currentLine) {
    return (currentLine-1)%LIST_SIZE === 0;
}

function splitPathToArray(path) {
    const pathArray = path.split('/');
    let menuArray = [];
    for (const menuName of pathArray) {
        if (menuName) menuArray.push(menuName);
    }
    return menuArray;
}

function Yamaha() 
{
}

// Navigates and selects the #number of the webradio favorites
Yamaha.prototype.switchToFavoriteNumber = function(favoritelistname, number){
    var self = this;
    return self.powerOn().then(function(){
        self.setMainInputTo("NET RADIO").then( function(){
            self.selectWebRadioListItem(1).then(function(){
                self.whenMenuReady("NET_RADIO").then(function(){
                    return self.selectWebRadioListItem(number);
                });
            });
        });
    });
};

// unfinished - not working
Yamaha.prototype.switchToWebRadioWithName = function(name){
    var self = this;
    self.setMainInputTo("NET RADIO").then(function(){

        self.getWebRadioList().then(xml2js.parseStringAsync).then(function(result){
            console.log(result);
        }, function (err) {
            console.log("err "+err);
        });

    });

};

Yamaha.prototype.getIndexOfMenuItem = async function(item, listName) {
    await this.jumpListItem(listName, 1);
    list = await this.getWebRadioList()
    while (true) {
        const Current_List = list.YAMAHA_AV[listName][0].List_Info[0].Current_List[0];
        let index = 1;
        for (const key in Current_List) {
            const itemName = Current_List[key][0]['Txt'][0];
            if (itemName === item) {
                return index;
            }
            index++
        }
        const Cursor_Position = list.YAMAHA_AV[listName][0].List_Info[0].Cursor_Position[0];
        const currentLine = Number(Cursor_Position.Current_Line[0]);
        if (!topOfCurrentListCheck) {
            throw new Error('top of viewable list not under cursor');
        }
        const maxLine = Number(Cursor_Position.Max_Line[0]);
        const nextCurrentLine = currentLine + LIST_SIZE;
        if (nextCurrentLine > maxLine) {
            break;
        }
        await this.jumpListItem(listName, nextCurrentLine);
        list = await this.getWebRadioList();
    }

    return -1;
}

Yamaha.prototype.gotoFolder = async function(path, listName) {
    const menuOrder = splitPathToArray(path);
    await this.setMainInputTo(listName.replace('_', ' '));
    let list = await this.getList(listName);

    let menuName = list.getMenuName();

    while (menuOrder.indexOf(menuName) < 0) {
        if (list.getMenuLayer() <= 1) {
            throw new Error('cannot gotoFolder, reached top of tree without finding known folder');
        }
        await this.remoteCursor('Return');
        list = await this.getWebRadioList();
        await this.jumpListItem(listName, 1);
        menuName = list.getMenuName(); 
    }

    maxIters = 100;
    iters = 0;
    while(menuName !== menuOrder[menuOrder.length - 1]) {
        iters++
        if (iters > maxIters) {
            throw new Error(`gotoFolder decend has run over 100 iterations`)
        }
        const currentLayer = menuOrder.indexOf(menuName);
        const nextMenuItemName = menuOrder[currentLayer + 1];
        list = await this.getWebRadioList();
        const index = await this.getIndexOfMenuItem(nextMenuItemName, listName);
        if (index < 0) {
            throw new Error(`cannot find menu item "${nextMenuItemName}" in "${menuName}"`)
        }
        await this.selectListItem(listName, index);
        list = await this.getWebRadioList();
        menuName = list.getMenuName();
    }
}


module.exports = Yamaha;
