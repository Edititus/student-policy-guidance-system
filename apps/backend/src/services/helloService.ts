export interface IHelloService {
  getHelloMessage(): Promise<{ message: string; timestamp: string }>
}

export class HelloService implements IHelloService {
  async getHelloMessage(): Promise<{ message: string; timestamp: string }> {
    return {
      message: 'Hello from AI Policy Guidance backend',
      timestamp: new Date().toISOString(),
    }
  }
}

export default HelloService
