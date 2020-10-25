/**
 * Applicable for mixin?
 * each command should be both ItemManager and BaseCommand
 * Base Command has private asyncEvents[] and each processEventAsync is only pushing to the asyncEvents
 * then, after command's execute method is done, command's result total_events = asyncEvents.length AND then it is saved
 * 
 */
export const processEventAsync = async () => {

}