/*   This macro is meant to automate the Sacred Weapon paladin Channel Divinity feature.
*    This means that you get to decide which weapon from your inventory you want to buff.
*    The macro automatically adds your Charisma modifier to the attackBonus field of the weapon.
*    Also removes a Channel Divinity slot. If you have no slots you can't use the macro!
*    (there is an option to not expend any slots also)
*    If the effect is already on your weapon executing the macro a second time reverts the changes to the weapon.
*
*    This macro uses the Warpgate modul!!! Whitout this modul the macro DOESN'T WORK!
*    Make sure to install it from: https://foundryvtt.com/packages/warpgate
*    This module is "closed" as of 2024/05/07 (yyyy/MM/dd) since the author quit, so if foundry changes something that ruins the module it means that this macro will no longer work.
*    
*    This macro uses the old data structure still not used from V10.
*    The macro still works tho (V11 b315)
*
*    Levente Ódor 2024/05/10 (yyyy/MM/dd)
*        Discord: thecringeone
*        Github: Levente007
*    Have fun slaying them dragons in them dungeons!
*/

// VARIABLES
let actor = canvas.tokens.controlled[0]?.actor || game.user.character;     
let cha = token.document.actor.system.abilities.cha.mod;
const mutName = "Sacred Weapon";

// ON SECOND CLICK REMOVE BUFF
if (!!warpgate.mutationStack(token.document).getName(mutName)) {
    await warpgate.revert(token.document, mutName);
    return;
}


//VALIDATIONS
// check if the actor has this ability or not
if (actor?.data.items.find(i => i.name === "Channel Divinity: Sacred Weapon") === undefined){
    return ui.notifications.error(`No actor selected has the "Sacred Weapon" feature`);
}
// check if the actor has Channel Divinity charges left
if (actor?.data.items.find(i => i.name === "Channel Divinity").system.uses.value <= 0) {
    return ui.notifications.error(`The selected actor has no more Channel Divinity charges left`);
}

//LOGIC
// Create a Dialog box to select the weapon to buff
let optionsText = ""; // all weapons to choose from
let allWeapons = actor?.data.items.filter(entry => entry.type === "weapon");
let i = 0
for (; i < allWeapons.length; i++) {
    optionsText += `<option value="${i}">${allWeapons[i].name}</option>`;
}
let confirmed = false;
new Dialog({
    title: "Sacred Weapon: Usage Configuration",
    content: `
    <form id="weaponToBuff-form">
        <p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Channel Divinity: Sacred Weapon", type: "feature"}) + `</p>
        <div class="form-group">
            <label>Weapon To Buff</label>
            <div class="form-fields">
                <select name="weaponToBuff">${optionsText}</select>
            </div>
        </div>
        
        <div class="form-group">
            <label class="checkbox">
                <input type="checkbox" name="consumeCheckbox" checked/>
                Use Channel Divinity Resource?
            </label>
        </div>
        <div class="form-group"><label>Token's Charisma Modifier: ${cha}</label></div>
        
    </form>
    `,
    buttons: {
        one: {
            icon: '<i class="fas fa-check"></i>',
            label: "Buff",
            callback: () => confirmed = true
        },
        two: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => confirmed = false
        }
    },
    default: "Cancel",
    close: html => {
        if (confirmed) {
            //remove Channel Divinity Slot
            if(html.find('[name=consumeCheckbox]')[0].checked) {
                const changedValue = actor?.data.items.find(i => i.name === "Channel Divinity").system.uses.value - 1;
                const updates = {
                    embedded: {
                        Item: {
                            "Channel Divinity": {
                                "system": {
                                    "uses": {
                                        "value": changedValue
                                    }
                                }
                            }
                        }
                    }
                }
                warpgate.mutate(token.document, updates, {}, {permanent: true});
            }
            
            weapon = allWeapons[parseInt(html.find('[name=weaponToBuff]')[0].value)];
            const originaAtckBonus = weapon.system.attack.bonus;
            const updates = {
                embedded: {
                    Item: {
                        [weapon.name]: {
                            "system": {
                                "attack": {
                                    "bonus": (originaAtckBonus == 0 ? "" : originaAtckBonus + "+") + cha
                                }
                            }
                        }
                    }
                }
            }
            warpgate.mutate(token.document, updates, {}, {name: mutName});
        }
    }
}).render(true);