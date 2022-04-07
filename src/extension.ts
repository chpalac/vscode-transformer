// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Prism from 'prismjs';
import {transformStylesObject} from 'v9helper-transform-style-object';
import {main} from 'v9helper';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "transformer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// let disposable = 
	
	let transforSelection = vscode.commands.registerCommand('transformer.selection', () => {
		const editor = vscode.window.activeTextEditor;
    
		main({ inputFilename: vscode.window.activeTextEditor?.document.fileName, exportName: 'result', isTransformAllThemes: true});
		var selection = editor?.selection;
		var text = editor?.document.getText(selection);
		
		const panel = vscode.window.createWebviewPanel('transformer', 'Transformer', vscode.ViewColumn.Beside, {
			retainContextWhenHidden: true,
			enableScripts: true
		});

		
		panel.webview.html = getWebviewContent(`${transformStylesObject(text)}`, panel, context);

		vscode.window.onDidChangeTextEditorSelection((ev) => {
			panel.webview.html = getWebviewContent(`${transformStylesObject(ev.textEditor.document.getText(ev.textEditor.selection))}`, panel, context);
		});

	});

	let transforFile = vscode.commands.registerCommand('transformer.file', async () => {
		
		const exportName = await vscode.window.showInputBox({
			placeHolder: "What is the name of the exported function?"
		});
		
		const { value: isTransformAllThemes } = await vscode.window.showQuickPick<{
			label: string;
			value: boolean;
		}>([
			{
				label: 'Yes',
				value: true,
			},
			{
				label: 'No',
				value: false,
			}
		], {
			placeHolder: "Transform all themes?"
		}) || { value: false };

		const  isNamespaced = /namespace/.test(`${vscode.window.activeTextEditor?.document.uri.path}`);

		const variables =  await vscode.window.showInputBox({
			placeHolder: !isNamespaced ? "Enter the name of the variables separated by commas" : "Enter the name of the variable"
		});
		let variableProps;
		if(isNamespaced){
			variableProps = await vscode.window.showInputBox({
				placeHolder: "Enter the name of the variable props separated by commas"
			});
		}

		const componentProps = await vscode.window.showInputBox({
			placeHolder: "Enter the name of the component props separated by commas"
		});

		const result = main({
			exportName,
			inputFilename: vscode.window.activeTextEditor?.document.uri.path,
			isTransformAllThemes
		})({
			variables: !isNamespaced ? variables?.split(',').reduce((acc, curr) => ({
				...acc,
				[curr]: true
			}), {}) : undefined,
			variable: isNamespaced ? variables : undefined,
			isNamespaced,
			componentProps: !!componentProps ? componentProps.split(',').reduce((acc, curr) => ({
				...acc,
				[curr]: true
			}), {}) : undefined,
			variableProps: isNamespaced ? variableProps?.split(',').reduce((acc, curr) => ({}), {}) : undefined
		});		

		const panel = vscode.window.createWebviewPanel('transformer', 'Transformer', vscode.ViewColumn.Beside, {
			retainContextWhenHidden: true,
			enableScripts: true
		});

		
		panel.webview.html = getWebviewContent(`${result}`, panel, context);
	  });

	context.subscriptions.push(transforSelection, transforFile);
	
}

function getWebviewContent(text: string, panel:vscode.WebviewPanel, context:vscode.ExtensionContext) {
	const prismStyles = panel.webview.asWebviewUri(vscode.Uri.joinPath(
		context.extensionUri, 'src/styles', 'prism.css'));
	const styles = panel.webview.asWebviewUri(vscode.Uri.joinPath(
			context.extensionUri, 'src/styles', 'styles.css'));

	
	return `<!DOCTYPE html>
<html lang="en">
<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link href="${prismStyles}" rel="stylesheet" />  
		<link href="${styles}" rel="stylesheet" />  
		<title>makeStyles</title>
</head>
<body>
	<main>
		<div class="actions">
			<button class="btn" onclick="copyData(code)">&#x274F; Click to copy</button>
		</div>
		<pre class="code" id="code">${Prism.highlight(text, Prism.languages.javascript, 'javascript')}</pre>
	</main>
	<script>
		function copyData(containerid) {
			var range = document.createRange();
			range.selectNode(containerid); //changed here
			window.getSelection().removeAllRanges(); 
			window.getSelection().addRange(range); 
			document.execCommand("copy");
			window.getSelection().removeAllRanges();
		}
	</script>
</body>
</html>`;
}



// this method is called when your extension is deactivated
export function deactivate() {}
