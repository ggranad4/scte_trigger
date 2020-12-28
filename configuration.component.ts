import { Component, OnInit } from '@angular/core';

import { LoadJsonService } from '../load-json.service';

import { KeyNumber } from "../key-value";
import { KeyString } from "../key-value";
import { KeyBool } from "../key-value"
import { KeyStringArray } from "../key-value";
import { KeyNumberArray } from "../key-value"
import { KeyObject } from "../key-value";
import { LocalBreak } from "../template_definitions";
import { HttpClient } from '@angular/common/http';

import { saveAs } from 'file-saver';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class ConfigurationComponent implements OnInit {

	public config: KeyObject;
	objectKeys = Object.keys;
	errorMessage: string;
	data: any = [];
	

	constructor(private LoadJsonService: LoadJsonService, private httpClient:HttpClient) {
	}
	getConfig(base: string = "USD"): Promise<any> {
		return this.httpClient.get("http://127.0.0.1:8000/get/CONE_123").toPromise();
	  }

	async requestData(base) {
		  this.data = await this.getConfig(base);
	}
	getConfigs(){
		return this.httpClient.get<any>("http://127.0.0.1:8000/get/CONE_123")
		
		
	}

	
 
  	ngOnInit(): void {
		this.getConfigs().subscribe(
			bookArr => this.data = bookArr
		)
		let url = "/assets/config.json"
		if(localStorage.getItem("config") != null) {
			let storedConfig = JSON.parse(localStorage.getItem("config"))
			this.config = <KeyObject> {key: "config", value: this.LoadJsonService.mapping(storedConfig, "config.value"), type: "expandable", path: "config"}
		} else {
			this.LoadJsonService.getConfig(url).subscribe(data => {
				this.config = data;
			})
		}
		console.log(this.config)
		localStorage.clear();
	}
	  
	addTemplate(type: string) {

	}

	arrayOfLength(length: number): number[] {
		let result = Array(length)
		for(let i=0; i < result.length; i++) {
			result[i] = i
		}
		return result
	}

	trackByKey(index: number, flag: KeyString|KeyNumber|KeyBool|KeyStringArray|KeyNumberArray|KeyObject): any {
		return flag.key
	}

	public addNode(node: KeyObject, event) {
		let typeOfNode = event.target.value;
		console.log(typeOfNode)
		if(typeOfNode == "string") {
			node.value.unshift(<KeyString> {key: "new_key"+String(Date.now()), value: "string_value", type: "terminal", path: node.path.concat("[0]")})
		} else if(typeOfNode == "number") {
			node.value.unshift(<KeyNumber> {key: "new_key"+String(Date.now()), value: 0, type: "terminal", path: node.path.concat("[0]")})
		} else if(typeOfNode == "boolean") {
			node.value.unshift(<KeyBool> {key: "new_key"+String(Date.now()), value: false, type: "terminal", path: node.path.concat("[0]")})
		} else if(typeOfNode == "numberArray") {
			node.value.unshift(<KeyNumberArray> {key: "new_key"+String(Date.now()), value: [42], type: "numberArray", path: node.path.concat("[0]")})
		} else if(typeOfNode == "stringArray") {
			node.value.unshift(<KeyStringArray> {key: "new_key"+String(Date.now()), value: [""], type: "stringArray", path: node.path.concat("[0]")})
		} else if(typeOfNode == "expandable") {
			node.value.unshift(<KeyObject> {key: "new_key"+String(Date.now()), value: {}, type: "expandable", path: node.path.concat("[0]")})
		}
		this.reload()
	}

	public deleteNode(node: KeyString|KeyNumber|KeyBool|KeyStringArray|KeyNumberArray|KeyObject) {
		let index = node.path.slice(node.path.length - 3).replace("[", "").replace("]", "")
		console.log(index)
		let path = "this." + node.path.slice(0, node.path.length - 3)
		console.log(eval(path))
		eval(path).splice(index, 1)
		this.reload()
		console.log("index: ", index)
	}

	private reload() {
		let newConfig = "{"
		for(let i = 0; i < this.config.value.length; i++) {
			newConfig = newConfig.concat(this.rebuildJson(this.config.value[i]))
			if(i + 1 < this.config.value.length) {
				newConfig = newConfig.concat(',')
			}
		}
		newConfig = newConfig.concat('}')
		localStorage.setItem("config", newConfig)
		window.location.reload()
	}

	public addToArray(node: KeyStringArray | KeyNumberArray) {
		if(node.type == "stringArray") {
			return node.value.push("new_item")
		} else {
			return node.value.push(42)
		}
	}

	public deleteFromArray(node: KeyStringArray | KeyNumberArray, index: number) {
		return node.value.splice(index, 1);
	}

	public submit(): void {
		console.log(this.config)
		let newConfig = "{"
		for(let i = 0; i < this.config.value.length; i++) {
			newConfig = newConfig.concat(this.rebuildJson(this.config.value[i]))
			if(i + 1 < this.config.value.length) {
				newConfig = newConfig.concat(',')
			}
		}
		newConfig = newConfig.concat('}')
		const blob = new Blob([newConfig], {type: 'application/json'});
		this.LoadJsonService.writeConfig(blob);
	}
	  
	private rebuildJson(node: any): string {
		let result = ''
		if("action" in node) {
			result = JSON.stringify(node)
		}
		else {
			if(typeof node.value == "string") {
				result = '"'.concat(node.key,'": "', node.value,'"')
			}
			else if(typeof node.value == "number") {
				result = '"'.concat(node.key,'": ', String(node.value))
			}
			else if (typeof node.value == "boolean") {
				result = '"'.concat(node.key,'": ', String(node.value))
			}
			else if(node.type == "stringArray") {
				result = '"'.concat(node.key,'": [')
				for(let idx=0; idx < node.value.length; idx++) {
					result = result.concat('"',String(node.value[idx]),'"')
					if(idx + 1 < node.value.length) {
						result = result.concat(",")
					}
				}
				result = result.concat("]")
			}
			else if(node.type == "numberArray") {
				result = '"'.concat(node.key,'": [')
				for(let idx=0; idx < node.value.length; idx++) {
					result = result.concat(String(node.value[idx]))
					if(idx + 1 < node.value.length) {
						result = result.concat(",")
					}
				}
				result = result.concat("]")
			}
			else if(node.type == "expandable") {
				result = result.concat('"',node.key,'": {')
				for(let index = 0; index < node.value.length; index++) {
					result = result.concat(this.rebuildJson(node.value[index]))
					if(index + 1 < node.value.length) {
						result = result.concat(',')
					}
				}
				result = result.concat('}')
			}
		}
		return result
	}

}
