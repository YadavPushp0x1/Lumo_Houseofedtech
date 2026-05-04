describe('Smoke', () => {
  it('shows the app', async () => {
    await expect(element(by.text('Courses'))).toBeVisible();
  });
});

