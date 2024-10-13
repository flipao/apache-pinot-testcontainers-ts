export type PostResponse = {
  status: number;
};

export type BatchConfigMap = {
  inputFormat: string;
  'recordReader.prop.delimiter'?: string;
};

export class PinotControllerService {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public async createSchema(schemaConfig: string): Promise<boolean> {
    const resp = await this.doPost(`${this.endpoint}/schemas`, schemaConfig);
    if (resp.status === 200) {
      return true;
    }
    return false;
  }

  public async createTable(tableConfig: string): Promise<boolean> {
    const resp = await this.doPost(`${this.endpoint}/tables`, tableConfig);
    if (resp.status === 200) {
      return true;
    }
    return false;
  }

  public async ingestFromFile(
    tableName: string,
    fileContent: string | Blob,
    batchConfigMap: BatchConfigMap = {
      inputFormat: 'csv',
      'recordReader.prop.delimiter': ',',
    },
  ): Promise<boolean> {
    const formData = new FormData();
    formData.append('input', fileContent);

    const url = `${this.endpoint}/ingestFromFile?tableNameWithType=${tableName}&batchConfigMapStr=${JSON.stringify(batchConfigMap)}`;

    const req = new Request(url, {
      method: 'POST',
      body: formData,
    });

    console.log('>>>> raw request', req);

    const resp = await fetch(req);

    if (resp.status === 200) {
      return true;
    }
    return false;
  }

  private async doPost(
    url: string,
    body: string,
    contentType: string = 'application/json',
  ): Promise<Response> {
    const req = new Request(url, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
      },
      body: body,
    });

    return await fetch(req);
  }
}
