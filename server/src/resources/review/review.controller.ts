import {NextFunction, Request, Response, Router} from 'express';
import selectFieldsMiddleware from '@/middleware/requests/select-fields.middleware';
import validationMiddleware from '@/middleware/validation.middleware';
import filteringMiddleware from '@/middleware/requests/filtering.middleware';
import updateMiddleware from '@/middleware/requests/update.middleware';
import authenticate from '@/middleware/auth/authentication.middleware';
import UserService from '@/resources/user/user.service';
import restrictTo from '@/middleware/auth/authorization.middleware';
import Controller from '@/utils/interfaces/controller.interface';
import catchAsync from "@/utils/errors/catch-async";
import RoleEnum from '@/utils/enums/role.enum';
import validate from '@/resources/user/user.validation';
import response from '@/utils/response';


class UserController implements Controller {
    public readonly PATH = 'users';
    public readonly router = Router();
    private readonly userService = new UserService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router
            .route('/')
            .get(
                authenticate,
                this.getCurrentUser
            )
            .patch(
                authenticate,
                validationMiddleware(validate.bodyUpdateUser),
                updateMiddleware,
                this.updateCurrentUser
            )
            .delete(
                authenticate,
                this.deactivateCurrentUser
            );

        this.router
            .route('/register')
            .post(
                validationMiddleware(validate.bodyRegister),
                this.register
            );

        this.router
            .route('/login')
            .post(
                validationMiddleware(validate.bodyLogin),
                this.login
            );

        this.router
            .route('/forgot-password')
            .post(
                validationMiddleware(validate.bodyForgotPassword),
                this.forgotPassword
            );

        this.router
            .route('/reset-password/:token')
            .patch(
                validationMiddleware(validate.bodyResetPassword),
                this.resetPassword
            );

        this.router
            .route('/update-password')
            .patch(
                authenticate,
                validationMiddleware(validate.bodyUpdatePassword),
                this.updatePassword
            );

        this.router
            .route('/reviews')
            .get(
                authenticate,
                filteringMiddleware,
                selectFieldsMiddleware,
                this.getCurrentUserReviews
            );

        this.router
            .route('/:id')
            .get(
                authenticate, // Use this before restrictTo to make it work
                restrictTo(RoleEnum.ADMIN),
                selectFieldsMiddleware,
                this.getUser
            )
            .delete(
                authenticate,
                restrictTo(RoleEnum.ADMIN),
                this.deleteUser
            );

        this.router
            .route('/:id/reviews')
            .get(
                filteringMiddleware,
                selectFieldsMiddleware,
                this.getUserReviews
            );
    }

    private register = catchAsync(async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const {
            firstName,
            lastName,
            login,
            email,
            password,
            addresses,
            defaultCurrency
        } = req.body;

        const token = await this.userService.register(
            firstName,
            lastName,
            login,
            email,
            password,
            addresses,
            ['user'],
            defaultCurrency || process.env.DEFAULT_CURRENCY
        );

        await this.sendToken(res, token);
    })

    private login = catchAsync(async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const {email, password} = req.body;
        const token = await this.userService.login(email, password);

        await this.sendToken(res, token);
    })

    private getCurrentUser = catchAsync(async (
        req: Request,
        res: Response
    ): Promise<void> => {
        await response.json(res, 200, req.user);
    })

    private deactivateCurrentUser = catchAsync(async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const {user} = req;
        await this.userService.deactivateUser(user.id);

        await response.json(res, 204, null);
    })

    private getUser = catchAsync(async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const id = req.params.id;
        const fields = req.fields;
        const user = await this.userService.getUser(id, fields);

        await response.json(res, 200, user);
    })

    private deleteUser = catchAsync(async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const id = req.params.id;
        await this.userService.deleteUser(id);

        await response.json(res, 204, null);
    })

    private forgotPassword = catchAsync(async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const {email} = req.body;
        const url = `${req.protocol}://${req.get('host')}/api/${process.env.API_VERSION}/${this.PATH}/reset-password`
        await this.userService.forgotPassword(url, email);

        await response.json(res, 200, 'Token has been sent to the specified email!');
    })

    private resetPassword = catchAsync(async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const resetToken = req.params.token;
        const {newPassword} = req.body;

        const token = await this.userService.resetPassword(resetToken, newPassword);

        await this.sendToken(res, token);
    })

    private updatePassword = catchAsync(async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const {user} = req;
        const {currPassword, newPassword} = req.body;
        const token = await this.userService.updatePassword(user.id, currPassword, newPassword);

        await this.sendToken(res, token);
    })

    private updateCurrentUser = catchAsync(async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const user = req.user;
        const updatedUser = await this.userService.updateUser(user.id, req.body);

        await response.json(res, 201, updatedUser);
    })

    private getUserReviews = catchAsync(async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const userID = req.params.id;
        const {filters, fields} = req;
        const {page, limit} = req.query;
        const pageNum = +(page || 0) || 1;
        const limitNum = +(limit || 0) || 30;

        const pagination = {
            skip: (pageNum - 1) * limitNum,
            limit: limitNum
        }

        const reviews = await this.userService.getUserReviews(userID, filters, fields, pagination);

        await response.json(res, 200, reviews);
    })

    private getCurrentUserReviews = catchAsync(async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        const user = req.user;
        req.params.id = user.id;
        this.getUserReviews(req, res, next);
    })

    private sendToken = async (
        res: Response,
        token: string
    ): Promise<void> => {
        const {JWT_COOKIE_EXPIRES_IN, NODE_ENV} = process.env;

        await response.cookie(res, 'jwt', token, {
            expires: new Date(
                Date.now() + Number(JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
            ),
            // Make cookie secure only in production
            secure: NODE_ENV === 'production',
            httpOnly: true
        });
        // TODO - this probably should not send token
        await response.json(res, 200, token);
    }
}


export default UserController;