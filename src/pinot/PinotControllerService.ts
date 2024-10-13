export type PostResponse = {
  status: number;
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

  private async doPost(url: string, body: string): Promise<Response> {
    const req = new Request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    return await fetch(req);
  }
}
